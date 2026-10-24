package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.jar.Attributes;
import java.util.jar.JarFile;

/** Explicit flat/Boot admission; native process/resource containment remains a separate boundary. */
final class RenderJvmLauncher {
    private static final String CHILD_MAIN = RenderChildMain.class.getName();
    private static final String PARENT_LIMIT_MAIN = NativeWorkerParentLimitMain.class.getName();
    private static final String BOOT_MAIN = "com.toonlira.translationgateway.TranslationGatewayApplication";
    private static final String JAR_LAUNCHER = "org.springframework.boot.loader.launch.JarLauncher";
    private static final String PROPERTIES_LAUNCHER = "org.springframework.boot.loader.launch.PropertiesLauncher";
    private static final String BOOT_VERSION = "4.1.1";
    private static final String BOOT_CLASSES = "BOOT-INF/classes/";
    private static final String BOOT_LIB = "BOOT-INF/lib/";
    private static final String NO_CONFIG = "META-INF/render-child-no-config.properties";
    private RenderJvmLauncher() { }

    static ProcessBuilder parentLimiter(Path directory) {
        return builder(directory, 64, PARENT_LIMIT_MAIN, true, true);
    }

    static ProcessBuilder builder(Path directory, int heapMiB, String mainClass) {
        return builder(directory, heapMiB, mainClass, false);
    }

    static ProcessBuilder builder(Path directory, int heapMiB, String mainClass, boolean nativeAccess) {
        return builder(directory, heapMiB, mainClass, nativeAccess, false);
    }

    static ProcessBuilder builder(Path directory, int heapMiB, String mainClass, RenderProcessSettings settings) {
        if (settings == null) throw new RenderFileException(CONFIGURATION);
        return builder(directory, heapMiB, mainClass, !(settings instanceof RenderChildSettings),
            settings instanceof BoundedNativeRenderChildSettings);
    }

    private static ProcessBuilder builder(Path directory, int heapMiB, String mainClass, boolean nativeAccess, boolean bounded) {
        try {
            // Surefire appends a trailing separator. Discard it, never interpret it as an implicit cwd entry.
            var entries = Arrays.stream(System.getProperty("java.class.path", "").split(File.pathSeparator))
                .map(value -> {
                    if (value.isBlank()) throw new RenderFileException(CONFIGURATION);
                    return Path.of(value);
                }).toList();
            return builder(directory, heapMiB, mainClass, entries, nativeAccess, bounded);
        } catch (RuntimeException error) { throw new RenderFileException(CONFIGURATION); }
    }

    static ProcessBuilder builder(Path directory, int heapMiB, String mainClass, List<Path> classpath) {
        return builder(directory, heapMiB, mainClass, classpath, false);
    }

    static ProcessBuilder builder(Path directory, int heapMiB, String mainClass, List<Path> classpath, boolean nativeAccess) {
        return builder(directory, heapMiB, mainClass, classpath, nativeAccess, false);
    }

    private static ProcessBuilder builder(Path directory, int heapMiB, String mainClass, List<Path> classpath,
                                          boolean nativeAccess, boolean bounded) {
        try {
            if (heapMiB < 64 || heapMiB > 2048 || directory == null || !directory.isAbsolute()
                || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS) || mainClass == null
                || !mainClass.matches("[A-Za-z0-9_.$]+") || bounded && heapMiB > 512)
                throw new RenderFileException(CONFIGURATION);
            boolean parentLimiter = PARENT_LIMIT_MAIN.equals(mainClass);
            if (parentLimiter && (!nativeAccess || !bounded || heapMiB != 64)) throw new RenderFileException(CONFIGURATION);
            var java = Path.of(System.getProperty("java.home"), "bin", "java").toRealPath();
            if (!Files.isExecutable(java)) throw new RenderFileException(CONFIGURATION);
            var command = new ArrayList<>(List.of(java.toString(), "-Xmx" + heapMiB + "m", "-Xms16m",
                "-XX:+ExitOnOutOfMemoryError", "-Djava.awt.headless=true", "-Djava.io.tmpdir=" + directory.toRealPath()));
            if (nativeAccess) command.add("--enable-native-access=ALL-UNNAMED");
            if (parentLimiter) command.addAll(List.of("-XX:MaxMetaspaceSize=64m", "-XX:CompressedClassSpaceSize=16m",
                "-XX:ReservedCodeCacheSize=32m", "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC",
                "-XX:MaxDirectMemorySize=64m", "-XX:-UsePerfData", "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null"));
            else if (bounded) command.addAll(List.of("-XX:MaxMetaspaceSize=96m", "-XX:CompressedClassSpaceSize=32m",
                "-XX:ReservedCodeCacheSize=64m", "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC",
                "-XX:MaxDirectMemorySize=384m", "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null"));
            appendClasspath(command, directory.toRealPath(), mainClass, classpath);
            var builder = new ProcessBuilder(command).directory(directory.toFile())
                .redirectOutput(ProcessBuilder.Redirect.DISCARD).redirectError(ProcessBuilder.Redirect.DISCARD);
            // In particular JAVA_TOOL_OPTIONS/JDK_JAVA_OPTIONS and Google credentials must not propagate.
            builder.environment().clear();
            // Fixed allocator policy for the bounded glibc helper/child; never inherit tunables or credentials.
            if (bounded && "Linux".equals(System.getProperty("os.name")))
                builder.environment().putAll(NativeCodecPlatform.runtime().childEnvironment());
            return builder;
        } catch (IOException | RuntimeException error) { throw new RenderFileException(CONFIGURATION); }
    }

    private static void appendClasspath(List<String> command, Path directory, String mainClass, List<Path> classpath)
        throws IOException {
        if (classpath == null || classpath.isEmpty()) throw new RenderFileException(CONFIGURATION);
        var entries = new ArrayList<String>();
        boolean boot = false;
        for (var value : classpath) {
            if (value == null || value.toString().isBlank() || value.toString().contains("*"))
                throw new RenderFileException(CONFIGURATION);
            var path = value.toAbsolutePath().toRealPath();
            if (Files.isRegularFile(path) && path.toString().endsWith(".jar")) {
                try (var jar = new JarFile(path.toFile())) {
                    if (isBoot(jar)) {
                        if (classpath.size() != 1 || !CHILD_MAIN.equals(mainClass) && !PARENT_LIMIT_MAIN.equals(mainClass))
                            throw new RenderFileException(CONFIGURATION);
                        validateBoot(jar);
                        if (PARENT_LIMIT_MAIN.equals(mainClass) && jar.getEntry(BOOT_CLASSES + PARENT_LIMIT_MAIN.replace('.', '/') + ".class") == null)
                            throw new RenderFileException(CONFIGURATION);
                        boot = true;
                    }
                }
            } else if (!Files.isDirectory(path)) throw new RenderFileException(CONFIGURATION);
            entries.add(path.toString());
        }
        if (boot) {
            // Missing controlled classpath config prevents PropertiesLauncher from reading cwd/home loader.properties.
            // An empty loader.path is NOT equivalent: this Boot version interprets it as a filesystem root path.
            command.addAll(List.of("-Dloader.main=" + mainClass, "-Dloader.home=" + directory,
                "-Dloader.path=" + BOOT_CLASSES + "," + BOOT_LIB,
                "-Dloader.config.location=classpath:/" + NO_CONFIG));
        }
        command.addAll(List.of("-cp", String.join(File.pathSeparator, entries), boot ? PROPERTIES_LAUNCHER : mainClass));
    }

    private static boolean isBoot(JarFile jar) throws IOException {
        var manifest = jar.getManifest();
        var attributes = manifest == null ? new Attributes() : manifest.getMainAttributes();
        return jar.stream().anyMatch(entry -> entry.getName().startsWith("BOOT-INF/"))
            || attributes.getValue("Spring-Boot-Version") != null
            || JAR_LAUNCHER.equals(attributes.getValue("Main-Class"));
    }

    private static void validateBoot(JarFile jar) throws IOException {
        var manifest = jar.getManifest();
        if (manifest == null) throw new RenderFileException(CONFIGURATION);
        var attributes = manifest.getMainAttributes();
        if (!JAR_LAUNCHER.equals(attributes.getValue("Main-Class"))
            || !BOOT_MAIN.equals(attributes.getValue("Start-Class"))
            || !BOOT_VERSION.equals(attributes.getValue("Spring-Boot-Version"))
            || !BOOT_CLASSES.equals(attributes.getValue("Spring-Boot-Classes"))
            || !BOOT_LIB.equals(attributes.getValue("Spring-Boot-Lib"))
            || attributes.keySet().stream().anyMatch(key -> key.toString().equalsIgnoreCase("Class-Path")
                || key.toString().regionMatches(true, 0, "Loader-", 0, 7))
            || jar.getEntry(BOOT_CLASSES) == null
            || jar.getEntry(BOOT_CLASSES + CHILD_MAIN.replace('.', '/') + ".class") == null
            || jar.getEntry(PROPERTIES_LAUNCHER.replace('.', '/') + ".class") == null
            || jar.getEntry(NO_CONFIG) != null || jar.getEntry(BOOT_CLASSES + NO_CONFIG) != null
            || jar.stream().noneMatch(entry -> !entry.isDirectory() && entry.getName().startsWith(BOOT_LIB)
                && entry.getName().endsWith(".jar"))) throw new RenderFileException(CONFIGURATION);
    }
}
