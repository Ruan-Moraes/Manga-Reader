package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.jar.Attributes;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;
import java.util.jar.Manifest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class RenderJvmLauncherTest {
    private static final String CHILD = RenderChildMain.class.getName();
    private static final String LOADER = "org.springframework.boot.loader.launch.PropertiesLauncher";
    private static final String NO_CONFIG = "META-INF/render-child-no-config.properties";
    private static final List<String> CONTENT = List.of("BOOT-INF/classes/", "BOOT-INF/lib/fixture.jar",
        "BOOT-INF/classes/" + CHILD.replace('.', '/') + ".class", LOADER.replace('.', '/') + ".class");
    @TempDir Path temporary;

    @Test void admitsFlatClasspathWithoutBootProperties() throws Exception {
        var classes = Files.createDirectory(temporary.resolve("classes"));
        var jar = archive(new Manifest(), List.of("fixture.class"));
        var builder = RenderJvmLauncher.builder(temporary, 128, CHILD, List.of(classes, jar));
        assertThat(builder.command()).contains("-Xmx128m", "-Djava.awt.headless=true", CHILD);
        assertThat(builder.command()).noneMatch(argument -> argument.startsWith("-Dloader."));
        assertThat(builder.environment()).isEmpty();
        assertThat(builder.redirectOutput()).isEqualTo(ProcessBuilder.Redirect.DISCARD);
        assertThat(builder.redirectError()).isEqualTo(ProcessBuilder.Redirect.DISCARD);
    }

    @Test void parentHelperUsesPinnedEntrySmallReservationsAndNoInheritedEnvironmentOrBusinessArguments() throws Exception {
        var previous = System.getProperty("java.class.path");
        var content = new ArrayList<>(CONTENT);
        var main = NativeWorkerParentLimitMain.class.getName();
        content.add("BOOT-INF/classes/" + main.replace('.', '/') + ".class");
        var jar = archive(manifest(), content);
        try {
            System.setProperty("java.class.path", jar.toString());
            var builder = RenderJvmLauncher.parentLimiter(temporary);
            assertThat(builder.command()).contains("-Xmx64m", "--enable-native-access=ALL-UNNAMED",
                "-XX:MaxDirectMemorySize=64m", "-XX:CompressedClassSpaceSize=16m", "-XX:-UsePerfData",
                "-Dloader.main=" + main);
            assertThat(builder.command().getLast()).isEqualTo(LOADER);
            assertThat(builder.environment()).isEqualTo("Linux".equals(System.getProperty("os.name"))
                ? NativeCodecPlatform.runtime().childEnvironment() : Map.of());
            assertThat(builder.redirectOutput()).isEqualTo(ProcessBuilder.Redirect.DISCARD);
            assertThat(builder.redirectError()).isEqualTo(ProcessBuilder.Redirect.DISCARD);
        } finally { System.setProperty("java.class.path", previous); }
    }

    @Test void missingHelperEntryInBootArchiveIsRefusedWithoutFallback() throws Exception {
        var previous = System.getProperty("java.class.path");
        var jar = archive(manifest(), CONTENT);
        try {
            System.setProperty("java.class.path", jar.toString());
            assertThatThrownBy(() -> RenderJvmLauncher.parentLimiter(temporary)).hasMessage("render-configuration").hasNoCause();
        } finally { System.setProperty("java.class.path", previous); }
    }

    @Test void bootUsesOnlyExplicitChildAndControlledInternalPaths() throws Exception {
        var jar = archive(manifest(), CONTENT);
        var builder = RenderJvmLauncher.builder(temporary, 768, CHILD, List.of(jar));
        assertThat(builder.command()).containsSubsequence("-cp", jar.toRealPath().toString(), LOADER);
        assertThat(builder.command()).contains("-Dloader.main=" + CHILD, "-Dloader.home=" + temporary.toRealPath(),
            "-Dloader.path=BOOT-INF/classes/,BOOT-INF/lib/",
            "-Dloader.config.location=classpath:/" + NO_CONFIG);
        assertThat(builder.command()).noneMatch(argument -> argument.startsWith("-Dloader.args="));
        assertThat(builder.command()).doesNotContain("-jar");
        assertThat(builder.environment()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"3.4.3", "3.5.15", "3.5.16", "4.0.0", "4.1.0", "4.1.2"})
    void unsupportedBootVersionNeverFallsBackToAnotherLauncher(String version) throws Exception {
        var manifest = manifest();
        manifest.getMainAttributes().putValue("Spring-Boot-Version", version);
        rejects(List.of(archive(manifest, CONTENT)), CHILD);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Main-Class", "Start-Class", "Spring-Boot-Version", "Spring-Boot-Classes", "Spring-Boot-Lib"})
    void rejectsMissingOrUnexpectedBootManifestAttribute(String name) throws Exception {
        var manifest = manifest();
        manifest.getMainAttributes().remove(new Attributes.Name(name));
        rejects(List.of(archive(manifest, CONTENT)), CHILD);
        manifest.getMainAttributes().putValue(name, "unexpected-private-value");
        rejects(List.of(archive(manifest, CONTENT)), CHILD);
    }

    @ParameterizedTest
    @ValueSource(strings = {"Class-Path", "Loader-Path", "Loader-Main", "Loader-Args", "Loader-ClassLoader", "Loader-Config-Location"})
    void rejectsExternalConfigurationDeclaredByArchive(String name) throws Exception {
        var manifest = manifest();
        manifest.getMainAttributes().putValue(name, "private-diagnostic");
        rejects(List.of(archive(manifest, CONTENT)), CHILD);
    }

    @ParameterizedTest
    @ValueSource(strings = {"BOOT-INF/classes/", "BOOT-INF/lib/fixture.jar",
        "BOOT-INF/classes/com/toonlira/translationgateway/infrastructure/rendering/RenderChildMain.class",
        "org/springframework/boot/loader/launch/PropertiesLauncher.class"})
    void rejectsMissingRequiredArchiveContent(String missing) throws Exception {
        var content = new ArrayList<>(CONTENT);
        content.remove(missing);
        rejects(List.of(archive(manifest(), content)), CHILD);
    }

    @ParameterizedTest
    @ValueSource(strings = {NO_CONFIG, "BOOT-INF/classes/" + NO_CONFIG})
    void rejectsArchiveThatCanResolveControlledMissingConfig(String entry) throws Exception {
        var content = new ArrayList<>(CONTENT);
        content.add(entry);
        rejects(List.of(archive(manifest(), content)), CHILD);
    }

    @Test void rejectsMixedBootClasspathAndUnintendedMain() throws Exception {
        var jar = archive(manifest(), CONTENT);
        rejects(List.of(temporary, jar), CHILD);
        rejects(List.of(jar, temporary), CHILD);
        rejects(List.of(jar), "com.toonlira.translationgateway.TranslationGatewayApplication");
    }

    @Test void rejectsEmptyMissingWildcardAndNullClasspathWithoutSensitiveCause() {
        rejects(List.of(), CHILD);
        rejects(List.of(temporary.resolve("missing-private-path")), CHILD);
        rejects(List.of(temporary.resolve("*.jar")), CHILD);
        rejects(null, CHILD);
    }

    @Test void ignoresSurefireTrailingSeparatorWithoutAddingCurrentDirectoryToClasspath() throws Exception {
        var previous = System.getProperty("java.class.path");
        var classes = Files.createDirectory(temporary.resolve("classes"));
        try {
            System.setProperty("java.class.path", classes + File.pathSeparator);
            var command = RenderJvmLauncher.builder(temporary, 128, CHILD).command();
            assertThat(command.get(command.indexOf("-cp") + 1)).isEqualTo(classes.toRealPath().toString());
            System.setProperty("java.class.path", File.pathSeparator + classes);
            assertThatThrownBy(() -> RenderJvmLauncher.builder(temporary, 128, CHILD))
                .isInstanceOf(RenderFileException.class).hasMessage("render-configuration").hasNoCause();
        } finally {
            if (previous == null) System.clearProperty("java.class.path");
            else System.setProperty("java.class.path", previous);
        }
    }

    @Test void malformedBootContentCannotBeMisclassifiedAsFlatJar() throws Exception {
        var content = new ArrayList<>(CONTENT);
        content.remove("BOOT-INF/classes/");
        rejects(List.of(archive(new Manifest(), content)), CHILD);
    }

    private void rejects(List<Path> classpath, String main) {
        assertThatThrownBy(() -> RenderJvmLauncher.builder(temporary, 768, main, classpath))
            .isInstanceOf(RenderFileException.class).hasMessage("render-configuration").hasNoCause();
    }

    private Path archive(Manifest manifest, List<String> entries) throws Exception {
        var path = Files.createTempFile(temporary, "fixture-", ".jar");
        manifest.getMainAttributes().putValue("Manifest-Version", "1.0");
        try (var output = new JarOutputStream(Files.newOutputStream(path), manifest)) {
            for (var name : entries) {
                output.putNextEntry(new JarEntry(name));
                if (!name.endsWith("/")) output.write(new byte[] {0});
                output.closeEntry();
            }
        }
        return path;
    }

    private static Manifest manifest() {
        var manifest = new Manifest();
        var attributes = manifest.getMainAttributes();
        attributes.putValue("Main-Class", "org.springframework.boot.loader.launch.JarLauncher");
        attributes.putValue("Start-Class", "com.toonlira.translationgateway.TranslationGatewayApplication");
        attributes.putValue("Spring-Boot-Version", "4.1.1");
        attributes.putValue("Spring-Boot-Classes", "BOOT-INF/classes/");
        attributes.putValue("Spring-Boot-Lib", "BOOT-INF/lib/");
        return manifest;
    }
}
