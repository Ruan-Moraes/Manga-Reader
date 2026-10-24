package com.toonlira.translationgateway.infrastructure.rendering;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.infrastructure.layout.ComicDetectorModel;
import com.toonlira.translationgateway.infrastructure.ocr.FakeVisionServer;
import com.toonlira.translationgateway.infrastructure.ocr.EvaluationVisionCapture;
import com.toonlira.translationgateway.infrastructure.translation.FakeTranslationServer;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;

/** Test-only local Linux probe. Never a worker adapter or an implicit image/dependency acquisition. */
final class LinuxRenderContainerFixture implements AutoCloseable {
    static final String IMAGE = "eclipse-temurin@sha256:f1286b7530a3ae2f9a9bad98a08fb99e2b4524afe508384fbb892bc8e37c86c1";
    static final String AMD64_IMAGE = "eclipse-temurin@sha256:2f9d7b671dd5f7acc9ced625afb7f90916c81668b905c9d03f52d3c8544c7db3";
    static final String GLIBC_ARM64_IMAGE = "eclipse-temurin@sha256:c31e783e090e5bcf4ddee2bfbce5bf78b5d832daae66767cb9a2315b8d4802b5";
    static final String GLIBC_AMD64_IMAGE = "eclipse-temurin@sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a";
    static final String ENCODER_SHA256 = "c1cbc3d46a3beb3883359dc9b112d7f5d08ed213a6a5d954f958b6c8baee7fc8";
    static final String DECODER_SHA256 = "9a4aab76f4597ef5f77363594d8772e5e26500036c2ca4d58904ec3b7805cbf5";
    private final Path docker;
    private final String endpoint;
    private final Path configuration;
    private final Path archive;
    private final Path codecs;
    private Path layoutModel, layoutLibraries;

    LinuxRenderContainerFixture(Path root) throws Exception {
        endpoint = validateEndpoint(System.getProperty("renderer.linux.docker.host"));
        docker = requireDocker(Path.of(System.getProperty("renderer.linux.docker.path", "/usr/local/bin/docker")));
        archive = requireFile(Path.of(System.getProperty("renderer.archive.path", "target/translation-gateway-0.0.1-SNAPSHOT.jar"))
            .toAbsolutePath());
        var configured = System.getProperty("renderer.linux.codec.directory");
        if (configured == null || configured.isBlank()) invalid();
        codecs = Path.of(configured);
        requireBinary(codecs.resolve("cwebp"), ENCODER_SHA256);
        requireBinary(codecs.resolve("dwebp"), DECODER_SHA256);
        configuration = Files.createTempDirectory(root, "docker-config-",
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
    }

    void render(Path original, Path staging) throws Exception {
        execute(original, staging, "/opt/java/openjdk/bin/java", List.of(
            "-Xmx512m", "-Xms16m", "-XX:+ExitOnOutOfMemoryError", "-Djava.awt.headless=true", "-Djava.io.tmpdir=/work",
            "-Dloader.main=" + RenderChildMain.class.getName(), "-Dloader.home=/work",
            "-Dloader.path=BOOT-INF/classes/,BOOT-INF/lib/",
            "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
            "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher"));
    }

    void encode(Path original, Path staging, String output) throws Exception {
        execute(original, staging, "/codecs/cwebp", List.of("-lossless", "-exact", "/original", "-o", "/work/" + output));
    }

    void decode(Path original, Path staging) throws Exception {
        execute(original, staging, "/codecs/dwebp", List.of("/original", "-o", "/work/decoded.png"));
    }

    void nativeCodec(Path libraries, Path staging) throws Exception {
        var library = requireFile(libraries.resolve("libwebp.so.7.2.0"));
        requireFile(libraries.resolve("libsharpyuv.so.0.1.2"));
        var probe = configuration.resolve("native-probe");
        var classFile = probe.resolve(NativeWebpCodecProbe.class.getName().replace('.', '/') + ".class");
        Files.createDirectories(classFile.getParent());
        try (var input = NativeWebpCodecProbe.class.getResourceAsStream("NativeWebpCodecProbe.class")) {
            Files.write(classFile, input.readAllBytes(), StandardOpenOption.CREATE_NEW);
        }
        var directory = staging.toRealPath();
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-native-" + UUID.randomUUID();
        var arguments = new ArrayList<>(createArguments(name, user, archive, codecs, library, directory,
            "/opt/java/openjdk/bin/java", List.of("--enable-native-access=ALL-UNNAMED", "-Xmx256m", "-Xms16m",
                "-XX:+ExitOnOutOfMemoryError", "-Djava.awt.headless=true", "-Djava.io.tmpdir=/tmp",
                "-Dloader.main=" + NativeWebpCodecProbe.class.getName(), "-Dloader.home=/work",
                "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher",
                "/build/install/lib/libwebp.so.7.2.0", "ae9bd6f135c9ccd5de96cacc19b155f5c646bf3362c6d39086f4b1e1df427eb8",
                "/build/install/lib/libsharpyuv.so.0.1.2", "f7ef39823cce822098b53a516262b07490a42f69522de1ff5aa9db73232fa457", "/work")));
        arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(libraries, "/build/install/lib", true),
            "--mount", mount(probe, "/probe", true)));
        try {
            command(arguments, Duration.ofSeconds(30));
            command(List.of("start", "--attach", name), Duration.ofSeconds(60));
        } finally { command(List.of("rm", "--force", name), Duration.ofSeconds(30)); }
    }

    void portableNativeCodec(Path libraries, String manifestHash, Path staging) throws Exception {
        distributionProbe(libraries, manifestHash, staging, NativeCodecDistributionProbe.class, true);
    }

    void portableAmd64Codec(Path libraries, String manifestHash, Path staging) throws Exception {
        distributionProbe(libraries, manifestHash, staging, NativeCodecDistributionProbe.class, true, AMD64_IMAGE);
    }

    void glibcCodec(Path libraries, String manifestHash, Path staging, boolean amd64) throws Exception {
        distributionProbe(libraries, manifestHash, staging, NativeCodecDistributionProbe.class, true,
            amd64 ? GLIBC_AMD64_IMAGE : GLIBC_ARM64_IMAGE);
    }

    int glibcLimitsProbe(Path staging, boolean amd64) throws Exception {
        return limitsProbe(staging, "guard", amd64 ? GLIBC_AMD64_IMAGE : GLIBC_ARM64_IMAGE);
    }

    ProbeState glibcSdkWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId, boolean amd64) throws Exception {
        return workerResourceProbe(staging, distribution, pin, networkId, "runtime-sdk", 8192,
            amd64 ? GLIBC_AMD64_IMAGE : GLIBC_ARM64_IMAGE);
    }

    ProbeState nativeImageSdkWorkerResourceProbe(Path staging, String pin, String networkId, String imageId) throws Exception {
        return nativeImageWorkerResourceProbe(staging, pin, networkId, imageId, "runtime-sdk");
    }

    void nativeImageVisualRender(Path original, Path staging, String imageId) throws Exception {
        if (imageId == null || !imageId.matches("sha256:[a-f0-9]{64}")) invalid();
        var directory = staging.toRealPath();
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-visual-render-" + UUID.randomUUID();
        var arguments = new ArrayList<>(createArguments(name, user, archive, codecs, requireFile(original), directory,
            NativeImageTestRuntime.configuredExecutable(imageId), List.of("--enable-native-access=ALL-UNNAMED",
                "-Xmx128m", "-Xms16m", "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=96m",
                "-XX:CompressedClassSpaceSize=32m", "-XX:ReservedCodeCacheSize=64m", "-XX:MaxDirectMemorySize=384m",
                "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null", "-XX:+ExitOnOutOfMemoryError",
                "-Djava.awt.headless=true", "-Djava.io.tmpdir=/tmp", "-Dloader.main=" + RenderChildMain.class.getName(),
                "-Dloader.home=/work", "-Dloader.path=BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher")));
        // Execute the JAR/libraries shipped inside the image, not a host archive override.
        int archiveMount = arguments.indexOf(mount(archive, "/app/gateway.jar", true));
        arguments.remove(archiveMount); arguments.remove(archiveMount - 1);
        arguments.set(arguments.indexOf(IMAGE), imageId);
        try {
            command(arguments, Duration.ofSeconds(30));
            command(List.of("start", "--attach", name), Duration.ofSeconds(60));
        } finally { command(List.of("rm", "--force", name), Duration.ofSeconds(30)); }
    }

    ProbeState nativeImageWorkerResourceProbe(Path staging, String pin, String networkId, String imageId, String scenario) throws Exception {
        if (imageId == null || !imageId.matches("sha256:[a-f0-9]{64}")) invalid();
        return workerResourceProbe(staging, null, pin, networkId, scenario, 8192, imageId, true);
    }

    ProbeState nativeImageLayoutWorkerResourceProbe(Path staging, String pin, String networkId, String imageId,
            NativeCodecPlatform target, Path model) throws Exception {
        layoutModel = requireFile(model.toRealPath());
        if (Files.size(layoutModel) > 192L * 1024 * 1024) invalid();
        ComicDetectorModel.verify(layoutModel);
        layoutLibraries = NativeLayoutFixtureLibraries.prepare(configuration, target);
        return nativeImageWorkerResourceProbe(staging, pin, networkId, imageId, "runtime-sdk-layout");
    }

    void amd64WorkerConfiguration(Path libraries, String manifestHash, Path staging) throws Exception {
        distributionProbe(libraries, manifestHash, staging, NativeWorkerConfigurationProbe.class, false, AMD64_IMAGE);
    }

    void nativeWorkerConfiguration(Path libraries, String manifestHash, Path staging) throws Exception {
        distributionProbe(libraries, manifestHash, staging, NativeWorkerConfigurationProbe.class, false);
    }

    void inspectOwnLimits(Path staging) throws Exception {
        if (limitsProbe(staging, "inspect") != 0) throw new AssertionError("limits-inspection-failed");
    }

    ProbeState workerResourceProbe(Path staging, Path distribution, String manifestHash, String networkId, String scenario) throws Exception {
        return workerResourceProbe(staging, distribution, manifestHash, networkId, scenario,
            workerMemoryMiB(System.getProperty("renderer.worker.memoryMiB")));
    }

    ProbeState workerResourceProbe(Path staging, Path distribution, String manifestHash, String networkId, String scenario,
                                  int memoryMiB) throws Exception {
        return workerResourceProbe(staging, distribution, manifestHash, networkId, scenario, memoryMiB, IMAGE);
    }

    ProbeState amd64WorkerResourceProbe(Path staging, Path distribution, String manifestHash, String networkId,
                                       String scenario) throws Exception {
        return workerResourceProbe(staging, distribution, manifestHash, networkId, scenario, 4096, AMD64_IMAGE);
    }

    ProbeState parentBoundedWorkerResourceProbe(Path staging, Path distribution, String manifestHash, String networkId,
                                              boolean amd64) throws Exception {
        return workerResourceProbe(staging, distribution, manifestHash, networkId, "parent-bounded", 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    void nativeWorkerMemoryRefusal(Path libraries, String manifestHash, Path staging, boolean amd64) throws Exception {
        distributionProbe(libraries, manifestHash, staging, NativeWorkerMemoryRefusalProbe.class, false, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState runtimeParentWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId, boolean amd64) throws Exception {
        return workerResourceProbe(staging, distribution, pin, networkId, "runtime-parent", 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState sdkWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId, boolean amd64) throws Exception {
        return workerResourceProbe(staging, distribution, pin, networkId, "runtime-sdk", 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState admittedFaultWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId, boolean amd64) throws Exception {
        return workerResourceProbe(staging, distribution, pin, networkId, "runtime-memory-fault", 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState admittedDiskFaultWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId, boolean amd64) throws Exception {
        return workerResourceProbe(staging, distribution, pin, networkId, "runtime-disk-fault", 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState admittedTimingWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId, boolean amd64, boolean cancellation) throws Exception {
        return workerResourceProbe(staging, distribution, pin, networkId, cancellation ? "runtime-cancel" : "runtime-timeout", 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState extendedWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId,
            boolean amd64, String language, String shape) throws Exception {
        String scenario;
        if (language != null && shape == null && SyntheticWorkerText.languages().contains(language)) scenario = "runtime-script-" + language;
        else if (language == null && List.of("wide", "tall", "row", "column").contains(shape)) scenario = "runtime-dimension-" + shape;
        else throw new IllegalArgumentException("synthetic-worker-scenario-invalid");
        return workerResourceProbe(staging, distribution, pin, networkId, scenario, 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState paintedScriptWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId,
            boolean amd64, String language) throws Exception {
        if (!SyntheticWorkerText.languages().contains(language)) throw new IllegalArgumentException("synthetic-worker-scenario-invalid");
        return workerResourceProbe(staging, distribution, pin, networkId, "runtime-painted-" + language, 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState alternateFormatWorkerResourceProbe(Path staging, Path distribution, String pin, String networkId,
            boolean amd64, String format) throws Exception {
        if (!List.of("jpeg", "webp").contains(format)) throw new IllegalArgumentException("synthetic-worker-scenario-invalid");
        return workerResourceProbe(staging, distribution, pin, networkId, "runtime-format-" + format, 8192, amd64 ? AMD64_IMAGE : IMAGE);
    }

    ProbeState maximumJpegPhaseProbe(Path staging, Path distribution, String pin, boolean amd64) throws Exception {
        return maximumJpegPhaseProbe(staging, distribution, pin, amd64, NativeProcessLimits.initial().addressSpaceBytes());
    }

    ProbeState maximumJpegPhaseProbe(Path staging, Path distribution, String pin, boolean amd64, long addressBytes) throws Exception {
        return maximumJpegPhaseProbe(staging, distribution, pin, amd64, addressBytes, 256);
    }

    ProbeState maximumJpegPhaseProbe(Path staging, Path distribution, String pin, boolean amd64, long addressBytes, int heapMiB) throws Exception {
        return maximumJpegPhaseProbe(staging, distribution, pin, amd64, addressBytes, heapMiB, RenderPolicy.initial().compressionMethod(), false);
    }

    ProbeState maximumJpegPhaseProbe(Path staging, Path distribution, String pin, boolean amd64, long addressBytes, int heapMiB, int method) throws Exception {
        return maximumJpegPhaseProbe(staging, distribution, pin, amd64, addressBytes, heapMiB, method, true);
    }

    private ProbeState maximumJpegPhaseProbe(Path staging, Path distribution, String pin, boolean amd64, long addressBytes, int heapMiB,
                                           int method, boolean explicitMethodProbe) throws Exception {
        if (addressBytes != NativeProcessLimits.initial().addressSpaceBytes() && addressBytes != 4L * 1024 * 1024 * 1024) invalid();
        if (!List.of(64, 128, 256).contains(heapMiB)) invalid();
        if (method != 0 && method != 4) invalid();
        var original = prepareMaximumAlternateFormat("jpeg");
        var metadata = LocalFileRenderAdapterTest.metadata(original);
        var admitted = NativeCodecDistribution.admit(distribution, pin, Duration.ofSeconds(60));
        var codec = new NativeRenderChildSettings(Path.of("/relocated/lib/libwebp.so.7"), admitted.librarySha256(),
            Path.of("/relocated/lib/libsharpyuv.so.0"), admitted.sharpSha256(), admitted.nativeTimeout());
        var initial = RenderPolicy.initial();
        var policy = new RenderPolicy(method == 4 ? "clean-box-1.0" : "clean-box-1.1", initial.maxOriginalBytes(),
            initial.maxWidthPx(), initial.maxHeightPx(), initial.maxPixels(), initial.maxOutputBytes(), initial.maxManifestBytes(),
            initial.minimumFontPx(), initial.maximumFontPx(), initial.paddingPx());
        RenderSubprocessProtocol.writeRequest(staging.resolve("request.bin"), Path.of("/original"),
            new BoundedNativeRenderChildSettings(codec, new NativeProcessLimits(addressBytes, NativeProcessLimits.initial().cpuSeconds(),
                NativeProcessLimits.initial().fileBytes(), NativeProcessLimits.initial().openFiles())),
            LocalFileRenderAdapterTest.request(metadata, List.of(), policy));
        var probe = configuration.resolve("jpeg-phase-probe");
        mountClass(probe, NativeRenderResourceProbe.class); mountClass(probe, RenderResourceMetrics.class);
        var directory = staging.toRealPath();
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-jpeg-phase-" + UUID.randomUUID();
        var arguments = new ArrayList<>(createArguments(name, user, archive, codecs, original, directory, "/opt/java/openjdk/bin/java",
            List.of("-Xmx" + heapMiB + "m", "-Xms16m", "-XX:+ExitOnOutOfMemoryError", "--enable-native-access=ALL-UNNAMED",
                "-XX:MaxMetaspaceSize=96m", "-XX:CompressedClassSpaceSize=32m", "-XX:ReservedCodeCacheSize=64m",
                "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-XX:MaxDirectMemorySize=384m",
                "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null", "-Djava.awt.headless=true", "-Djava.io.tmpdir=/work",
                "-Dloader.main=" + NativeRenderResourceProbe.class.getName(), "-Dloader.home=/work",
                "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher", pin)));
        arguments.set(arguments.indexOf("--memory=1g"), "--memory=8g");
        if (method == 0 && explicitMethodProbe) arguments.add("0");
        arguments.set(arguments.indexOf("--memory-swap=1g"), "--memory-swap=8g");
        selectImage(arguments, amd64 ? AMD64_IMAGE : IMAGE);
        int bind = arguments.indexOf(mount(directory, "/work", false));
        arguments.remove(bind); arguments.remove(bind - 1);
        arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--tmpfs", "/work:rw,noexec,nosuid,nodev,size=512m,mode=1777",
            "--mount", mount(directory, "/export", false), "--mount", mount(probe, "/probe", true),
            "--mount", mount(staging.resolve("request.bin"), "/inputs/request.bin", true), "--mount", mount(distribution.toRealPath(), "/relocated/lib", true)));
        var status = directory.resolve("probe-status.json");
        try {
            command(arguments, Duration.ofSeconds(30));
            commandExit(List.of("start", "--attach", name), Duration.ofMinutes(3), null);
            command(List.of("inspect", "--format", "{\"exitCode\":{{.State.ExitCode}},\"oomKilled\":{{.State.OOMKilled}}}", name),
                Duration.ofSeconds(30), status);
            return probeState(Files.readString(status));
        } finally { command(List.of("rm", "--force", name), Duration.ofSeconds(30)); }
    }

    private Path prepareMaximumAlternateFormat(String format) throws Exception {
        var directory = Files.createDirectory(configuration.resolve("fixture-" + UUID.randomUUID()));
        var probe = configuration.resolve("fixture-probe");
        var input = archive;
        String entrypoint;
        List<String> invocation;
        if (format.equals("jpeg")) {
            mountClassTree(probe, SyntheticResourceJpeg.class); mountClass(probe, SyntheticResourceJpegProbe.class);
            entrypoint = "/opt/java/openjdk/bin/java";
            invocation = List.of("-Xmx768m", "-Xms16m", "-XX:+ExitOnOutOfMemoryError", "-XX:ActiveProcessorCount=1",
                "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=96m", "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null",
                "-Djava.awt.headless=true", "-Djava.io.tmpdir=/tmp", "-Dloader.main=" + SyntheticResourceJpegProbe.class.getName(),
                "-Dloader.home=/work", "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher", "10000", "8000");
        } else {
            input = SyntheticResourcePng.multicolor(configuration.resolve("fixture-source-" + UUID.randomUUID() + ".png"), 10000, 8000);
            entrypoint = "/codecs/cwebp";
            invocation = List.of("-lossless", "-exact", "-q", "100", "-m", "4", "-metadata", "none", "/original", "-o", "/work/fixture.webp");
        }
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-fixture-" + UUID.randomUUID();
        // Preparation always uses cached ARM64 tools, even when an emulated AMD64 worker consumes its output.
        var arguments = new ArrayList<>(createArguments(name, user, archive, codecs, input, directory, entrypoint, invocation));
        arguments.set(arguments.indexOf("--memory=1g"), "--memory=2g");
        arguments.set(arguments.indexOf("--memory-swap=1g"), "--memory-swap=2g");
        arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--ulimit", "fsize=12582912:12582912", "--ulimit", "core=0:0",
            "--ulimit", "nofile=64:64"));
        if (format.equals("jpeg")) arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(probe, "/probe", true)));
        var stateFile = directory.resolve("fixture-state.json");
        try {
            command(arguments, Duration.ofSeconds(30));
            commandExit(List.of("start", "--attach", name), Duration.ofMinutes(2), null);
            command(List.of("inspect", "--format", "{\"exitCode\":{{.State.ExitCode}},\"oomKilled\":{{.State.OOMKilled}}}", name),
                Duration.ofSeconds(30), stateFile);
            var state = probeState(Files.readString(stateFile));
            if (state.exitCode() != 0 || state.oomKilled()) throw new AssertionError("synthetic-fixture-preparation-failed: " + state);
        } finally { command(List.of("rm", "--force", name), Duration.ofSeconds(30)); }
        var output = requireFile(directory.resolve("fixture." + format));
        var inspection = new MediaInspectionService();
        try (var source = Files.newInputStream(output)) {
            var media = inspection.inspect(source, 12L * 1024 * 1024);
            try {
                if (!media.mimeType().equals("image/" + format) || media.widthPx() != 10000 || media.heightPx() != 8000
                    || media.byteSize() <= 0 || !media.sha256().matches("[a-f0-9]{64}")) invalid();
            } finally { inspection.deleteQuietly(media.path()); }
        }
        return output;
    }

    private ProbeState workerResourceProbe(Path staging, Path distribution, String manifestHash, String networkId,
                                          String scenario, int memoryMiB, String image) throws Exception {
        return workerResourceProbe(staging, distribution, manifestHash, networkId, scenario, memoryMiB, image, false);
    }

    private ProbeState workerResourceProbe(Path staging, Path distribution, String manifestHash, String networkId,
                                          String scenario, int memoryMiB, String image, boolean imageArtifacts) throws Exception {
        boolean scripts = scenario.startsWith("runtime-script-") && SyntheticWorkerText.languages().contains(scenario.substring("runtime-script-".length()))
            || scenario.startsWith("runtime-painted-") && SyntheticWorkerText.languages().contains(scenario.substring("runtime-painted-".length()));
        boolean dimensions = List.of("runtime-dimension-wide", "runtime-dimension-tall", "runtime-dimension-row", "runtime-dimension-column").contains(scenario);
        boolean alternateFormat = List.of("runtime-format-jpeg", "runtime-format-webp").contains(scenario);
        boolean layout = scenario.equals("runtime-sdk-layout");
        if (scripts || dimensions || alternateFormat || layout || scenario.equals("parent-bounded") || scenario.equals("runtime-parent") || scenario.equals("runtime-sdk") || scenario.equals("runtime-memory-fault") || scenario.equals("runtime-disk-fault") || scenario.equals("runtime-timeout") || scenario.equals("runtime-cancel")) { if (memoryMiB != 8192) invalid(); }
        else workerMemoryMiB(Integer.toString(memoryMiB));
        if (networkId == null || !networkId.matches("[a-f0-9]{64}") || !(scripts || dimensions || alternateFormat || layout || List.of("small", "maximum", "memory-fault", "address-bounded", "parent-bounded", "runtime-parent", "runtime-sdk", "runtime-memory-fault", "runtime-disk-fault", "runtime-timeout", "runtime-cancel").contains(scenario))
            || manifestHash == null || !manifestHash.matches("[a-f0-9]{64}")) invalid();
        var directory = staging.toRealPath();
        var originalPath = configuration.resolve("worker-original-" + UUID.randomUUID() + ".png");
        int width = switch (scenario) { case "runtime-dimension-wide", "runtime-dimension-row" -> 12000; case "runtime-dimension-tall" -> 6666;
            case "runtime-dimension-column" -> 1; case "small" -> 320; default -> 10000; };
        int height = switch (scenario) { case "runtime-dimension-tall", "runtime-dimension-column" -> 12000; case "runtime-dimension-wide" -> 6666;
            case "runtime-dimension-row" -> 1; case "small" -> 220; default -> 8000; };
        var original = alternateFormat ? prepareMaximumAlternateFormat(scenario.substring("runtime-format-".length()))
            : SyntheticResourcePng.multicolor(originalPath, width, height);
        var probe = configuration.resolve("worker-probe");
        mountClassTree(probe, NativeRenderingWorkerProbe.class); mountClass(probe, RenderResourceMetrics.class); mountClass(probe, SyntheticWorkerText.class);
        // Spring reflects Providers' field/method types even when its SDK branch is disabled.
        // Supplying classes does not construct servers or initialize credentials.
        mountClass(probe, LoopbackWorkerProviders.class);
        mountClass(probe, FakeVisionServer.class);
        mountClass(probe, FakeTranslationServer.class);
        // FakeVisionServer's overload references this type even when no capture is requested.
        mountClassTree(probe, EvaluationVisionCapture.class);
        if (scenario.equals("runtime-memory-fault") || scenario.equals("runtime-disk-fault") || scenario.equals("runtime-timeout") || scenario.equals("runtime-cancel")) mountClass(probe, AdmittedRenderFaults.class);
        if (scenario.equals("parent-bounded")) mountClassTree(probe, OwnedParentAddressProbe.class);
        var springTest = supportJar(MockMvc.class, "6ce8fc116f5d309b9ac50a6738bd1b15ea4012a4a5563c0ee89b795bfc9af0dc");
        var securityTest = supportJar(SecurityMockMvcConfigurers.class, "85a8804e13e47186c86ce224954645b20df9d340e8c000e158050adc61c61d5a");
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-worker-" + UUID.randomUUID();
        var executable = imageArtifacts ? NativeImageTestRuntime.configuredExecutable(image) : "/opt/java/openjdk/bin/java";
        var arguments = new ArrayList<>(createArguments(name, user, archive, codecs, original, directory,
            executable, List.of("-Xmx512m", "-Xms16m", "-XX:+ExitOnOutOfMemoryError",
                "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=192m",
                "-Djava.awt.headless=true", "-Djava.io.tmpdir=/work/tmp",
                "-Dloader.main=" + NativeRenderingWorkerProbe.class.getName(), "-Dloader.home=/work",
                "-Dloader.path=/probe,/support/spring-test.jar,/support/security-test.jar,BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher", scenario, manifestHash)));
        arguments.set(arguments.indexOf("--network=none"), "--network=" + networkId);
        if (imageArtifacts) {
            if (image == null || !image.matches("sha256:[a-f0-9]{64}")) invalid();
            arguments.set(arguments.indexOf(IMAGE), image);
            int jar = arguments.indexOf(mount(archive, "/app/gateway.jar", true));
            arguments.remove(jar); arguments.remove(jar - 1);
            int configuredUser = arguments.indexOf("--user");
            arguments.remove(configuredUser + 1); arguments.remove(configuredUser);
            // Only generated/exported test artifacts use this directory. Default image UID must not be masked.
            Files.setPosixFilePermissions(directory, PosixFilePermissions.fromString("rwxrwxrwx"));
        } else selectImage(arguments, image);
        arguments.set(arguments.indexOf("--memory=1g"), "--memory=" + memoryMiB + "m");
        if (List.of(GLIBC_ARM64_IMAGE, GLIBC_AMD64_IMAGE).contains(image)) {
            // Explicit diagnostic allocator policy for the glibc worker, not an inherited host setting or RAM admission.
            arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--env", "MALLOC_ARENA_MAX=2"));
        }
        arguments.set(arguments.indexOf("--memory-swap=1g"), "--memory-swap=" + memoryMiB + "m");
        int workBind = arguments.indexOf(mount(directory, "/work", false));
        arguments.remove(workBind); arguments.remove(workBind - 1);
        arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--tmpfs", "/work:rw,noexec,nosuid,nodev,size=512m,mode=1777",
            "--mount", mount(directory, "/export", false), "--mount", mount(probe, "/probe", true),
            "--mount", mount(springTest, "/support/spring-test.jar", true), "--mount", mount(securityTest, "/support/security-test.jar", true)));
        if (!imageArtifacts) arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(distribution.toRealPath(), "/relocated/lib", true)));
        if (layout) {
            if (!imageArtifacts || layoutModel == null || layoutLibraries == null) invalid();
            arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(layoutModel, "/model/detector.onnx", true),
                "--mount", mount(layoutLibraries, "/layout-runtime", true)));
            arguments.add(arguments.indexOf("-Djava.awt.headless=true"), "-Donnxruntime.native.path=/layout-runtime");
        }
        if (layout || scenario.equals("memory-fault") || scenario.equals("address-bounded") || scenario.equals("runtime-memory-fault") || scenario.equals("runtime-disk-fault") || scenario.equals("runtime-timeout") || scenario.equals("runtime-cancel")) {
            var recovery = SyntheticResourcePng.multicolor(configuration.resolve("worker-recovery-" + UUID.randomUUID() + ".png"), 320, 220);
            arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(recovery, "/recovery-original", true)));
        }
        var status = directory.resolve("probe-status.json");
        try {
            command(arguments, Duration.ofSeconds(30));
            commandExit(List.of("start", "--attach", name), Duration.ofMinutes(4), null);
            command(List.of("inspect", "--format", "{\"exitCode\":{{.State.ExitCode}},\"oomKilled\":{{.State.OOMKilled}}}", name),
                Duration.ofSeconds(30), status);
            return probeState(Files.readString(status));
        } finally { command(List.of("rm", "--force", name), Duration.ofSeconds(30)); }
    }

    // Diagnostic opt-in only: a larger measurement cannot silently approve the default budget or cloud sizing.
    static int workerMemoryMiB(String value) {
        if (value == null || value.equals("2048")) return 2048;
        if (value.equals("4096")) return 4096;
        invalid(); return 0;
    }

    static Path supportJar(Class<?> type, String pin) throws Exception {
        var file = requireFile(Path.of(type.getProtectionDomain().getCodeSource().getLocation().toURI()).toRealPath());
        if (Files.size(file) > 4L * 1024 * 1024 || !Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)
            || !HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(file))).equals(pin)) invalid();
        return file;
    }

    private static void mountClassTree(Path directory, Class<?> type) throws Exception {
        mountClass(directory, type);
        for (var member : type.getDeclaredClasses()) mountClassTree(directory, member);
    }

    int limitsProbe(Path staging, String mode) throws Exception {
        return limitsProbe(staging, mode, IMAGE);
    }

    int amd64LimitsProbe(Path staging) throws Exception { return limitsProbe(staging, "guard", AMD64_IMAGE); }

    private int limitsProbe(Path staging, String mode, String image) throws Exception {
        var probe = configuration.resolve("limits-probe"); mountClass(probe, RenderLinuxLimitsProbe.class);
        var directory = staging.toRealPath();
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-limits-" + UUID.randomUUID();
        var arguments = new ArrayList<>(createArguments(name, user, archive, codecs, archive, directory,
            "/opt/java/openjdk/bin/java", List.of("--enable-native-access=ALL-UNNAMED", "-Xmx256m", "-Xms16m",
                "-XX:MaxMetaspaceSize=96m", "-XX:CompressedClassSpaceSize=32m", "-XX:ReservedCodeCacheSize=64m",
                "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-XX:MaxDirectMemorySize=384m",
                "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null", "-XX:+ExitOnOutOfMemoryError",
                "-Djava.awt.headless=true", "-Djava.io.tmpdir=/tmp", "-Dloader.main=" + RenderLinuxLimitsProbe.class.getName(),
                "-Dloader.home=/work", "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties", "-cp", "/app/gateway.jar",
                "org.springframework.boot.loader.launch.PropertiesLauncher", mode, "/work")));
        arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(probe, "/probe", true)));
        selectImage(arguments, image);
        try {
            command(arguments, Duration.ofSeconds(30));
            int exit = commandExit(List.of("start", "--attach", name), Duration.ofSeconds(60), null);
            command(List.of("inspect", "--format", "{\"exitCode\":{{.State.ExitCode}},\"oomKilled\":{{.State.OOMKilled}}}", name),
                Duration.ofSeconds(30), directory.resolve("container-state.json"));
            return exit;
        }
        finally { command(List.of("rm", "--force", name), Duration.ofSeconds(30)); }
    }

    private void distributionProbe(Path libraries, String manifestHash, Path staging, Class<?> main, boolean nativeAccess) throws Exception {
        distributionProbe(libraries, manifestHash, staging, main, nativeAccess, IMAGE);
    }

    private void distributionProbe(Path libraries, String manifestHash, Path staging, Class<?> main, boolean nativeAccess,
                                   String image) throws Exception {
        var probe = configuration.resolve("portable-probe");
        mountClass(probe, main);
        if (nativeAccess) mountClass(probe, NativeWebpCodecProbe.class);
        var directory = staging.toRealPath();
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-portable-" + UUID.randomUUID();
        var arguments = new ArrayList<>(createArguments(name, user, archive, codecs,
            libraries.resolve("manifest.properties"), directory, "/opt/java/openjdk/bin/java", List.of(
                "--enable-native-access=ALL-UNNAMED", "-Xmx256m", "-Xms16m", "-XX:+ExitOnOutOfMemoryError",
                "-Djava.awt.headless=true", "-Djava.io.tmpdir=/tmp",
                "-Dloader.main=" + main.getName(), "-Dloader.home=/work",
                "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher", manifestHash, "/work")));
        if (!nativeAccess) arguments.remove("--enable-native-access=ALL-UNNAMED");
        selectImage(arguments, image);
        if (main == NativeWorkerConfigurationProbe.class) {
            // This historical slim-bean proof must now satisfy the real admission, not bypass it.
            arguments.set(arguments.indexOf("--memory=1g"), "--memory=8g");
            arguments.set(arguments.indexOf("--memory-swap=1g"), "--memory-swap=8g");
            arguments.addAll(arguments.indexOf("-Xms16m"), List.of("-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=192m"));
            int bind = arguments.indexOf(mount(directory, "/work", false));
            arguments.remove(bind); arguments.remove(bind - 1);
            arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--tmpfs", "/work:rw,noexec,nosuid,nodev,size=512m,mode=1777",
                "--mount", mount(directory, "/export", false)));
            if (List.of(GLIBC_ARM64_IMAGE, GLIBC_AMD64_IMAGE).contains(image))
                arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--env", "MALLOC_ARENA_MAX=2"));
            arguments.set(arguments.size() - 1, "/export");
        }
        arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(libraries, "/relocated/lib", true),
            "--mount", mount(probe, "/probe", true)));
        try {
            command(arguments, Duration.ofSeconds(30)); command(List.of("start", "--attach", name), Duration.ofSeconds(60));
        } finally { command(List.of("rm", "--force", name), Duration.ofSeconds(30)); }
    }

    ProbeState probe(Path original, Path staging, ProbeBudget budget) throws Exception {
        return resourceProbe(original, staging, budget, null);
    }

    ProbeState nativeResourceProbe(Path original, Path staging, ProbeBudget budget, Path libraries) throws Exception {
        requireFile(libraries.resolve("libwebp.so.7.2.0")); requireFile(libraries.resolve("libsharpyuv.so.0.1.2"));
        return resourceProbe(original, staging, budget, libraries);
    }

    ProbeState isolatedNativeResourceProbe(Path original, Path staging, ProbeBudget budget, Path libraries) throws Exception {
        requireFile(libraries.resolve("libwebp.so.7.2.0")); requireFile(libraries.resolve("libsharpyuv.so.0.1.2"));
        return resourceProbe(original, staging, budget, libraries, IsolatedNativeRenderResourceProbe.class);
    }

    private ProbeState resourceProbe(Path original, Path staging, ProbeBudget budget, Path libraries) throws Exception {
        return resourceProbe(original, staging, budget, libraries,
            libraries == null ? LinuxRenderResourceProbe.class : NativeRenderResourceProbe.class);
    }

    private ProbeState resourceProbe(Path original, Path staging, ProbeBudget budget, Path libraries, Class<?> main) throws Exception {
        var source = requireFile(original);
        var directory = staging.toRealPath();
        requireFile(directory.resolve("request.bin"));
        var probe = configuration.resolve("probe");
        mountClass(probe, main);
        mountClass(probe, RenderResourceMetrics.class);
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-linux-" + UUID.randomUUID();
        var status = directory.resolve("probe-status.json");
        try {
            var arguments = new ArrayList<>(libraries == null ? probeArguments(name, user, archive, codecs, source, directory, probe, budget)
                : nativeProbeArguments(name, user, archive, codecs, source, directory, probe, budget, libraries));
            if (main == IsolatedNativeRenderResourceProbe.class) {
                arguments.set(arguments.indexOf("-Dloader.main=" + NativeRenderResourceProbe.class.getName()),
                    "-Dloader.main=" + main.getName());
                // Only the explicitly selected child gets FFM access; the supervisor does not load native code.
                arguments.remove("--enable-native-access=ALL-UNNAMED");
            }
            command(arguments, Duration.ofSeconds(30));
            commandExit(List.of("start", "--attach", name), Duration.ofSeconds(240), null);
            command(List.of("inspect", "--format", "{\"exitCode\":{{.State.ExitCode}},\"oomKilled\":{{.State.OOMKilled}}}", name),
                Duration.ofSeconds(30), status);
            if (Files.size(status) > 4096) invalid();
            return probeState(Files.readString(status));
        } finally {
            command(List.of("rm", "--force", name), Duration.ofSeconds(30));
            Files.deleteIfExists(status);
        }
    }

    private static void mountClass(Path directory, Class<?> type) throws Exception {
        var file = directory.resolve(type.getName().replace('.', '/') + ".class");
        byte[] current = classBytes(type);
        if (Files.exists(file)) {
            if (!MessageDigest.isEqual(Files.readAllBytes(file), current)) invalid();
        } else {
            Files.createDirectories(file.getParent()); Files.write(file, current, StandardOpenOption.CREATE_NEW);
        }
    }

    static byte[] classBytes(Class<?> type) throws IOException {
        if (type == null) { invalid(); }
        // Nested classes have a binary '$' name. getSimpleName() is not their resource filename.
        try (var input = type.getResourceAsStream("/" + type.getName().replace('.', '/') + ".class")) {
            if (input == null) { invalid(); }
            var bytes = input.readNBytes(2 * 1024 * 1024 + 1);
            if (bytes.length < 4 || bytes.length > 2 * 1024 * 1024) { invalid(); }
            return bytes;
        }
    }

    static List<String> nativeProbeArguments(String name, String user, Path archive, Path codecs, Path original,
            Path staging, Path probe, ProbeBudget budget, Path libraries) {
        var arguments = new ArrayList<>(probeArguments(name, user, archive, codecs, original, staging, probe, budget));
        arguments.set(arguments.indexOf("-Dloader.main=" + LinuxRenderResourceProbe.class.getName()),
            "-Dloader.main=" + NativeRenderResourceProbe.class.getName());
        arguments.add(arguments.indexOf("-Xms16m"), "--enable-native-access=ALL-UNNAMED");
        arguments.addAll(arguments.indexOf("--entrypoint"), List.of("--mount", mount(libraries, "/build/install/lib", true)));
        return List.copyOf(arguments);
    }

    static List<String> probeArguments(String name, String user, Path archive, Path codecs, Path original,
                                      Path staging, Path probe, ProbeBudget budget) {
        if (budget == null) invalid();
        var command = new ArrayList<>(createArguments(name, user, archive, codecs, original, staging,
            "/opt/java/openjdk/bin/java", List.of("-Xmx" + budget.heapMiB() + "m", "-Xms16m",
                "-XX:+ExitOnOutOfMemoryError", "-Djava.awt.headless=true", "-Djava.io.tmpdir=/work",
                "-Dloader.main=" + LinuxRenderResourceProbe.class.getName(), "-Dloader.home=/work",
                "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/",
                "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher")));
        command.set(command.indexOf("--memory=1g"), "--memory=" + budget.memoryMiB() + "m");
        command.set(command.indexOf("--memory-swap=1g"), "--memory-swap=" + budget.memoryMiB() + "m");
        int bind = command.indexOf(mount(staging, "/work", false));
        command.remove(bind); command.remove(bind - 1);
        command.addAll(command.indexOf("--entrypoint"), List.of("--tmpfs",
            "/work:rw,noexec,nosuid,nodev,size=" + budget.scratchKiB() + "k,mode=1777",
            "--mount", mount(staging, "/export", false), "--mount", mount(staging.resolve("request.bin"), "/inputs/request.bin", true),
            "--mount", mount(probe, "/probe", true)));
        return List.copyOf(command);
    }

    static ProbeState probeState(String json) {
        try {
            if (json == null || json.length() > 4096) invalid();
            var value = GatewayJsonMapper.create().readTree(json);
            if (!value.isObject() || value.size() != 2 || !value.has("exitCode") || !value.has("oomKilled")
                || !value.get("exitCode").isInt() || value.get("exitCode").intValue() < 0
                || value.get("exitCode").intValue() > 255 || !value.get("oomKilled").isBoolean()) invalid();
            return new ProbeState(value.get("exitCode").intValue(), value.get("oomKilled").booleanValue());
        } catch (Exception error) { throw new IllegalArgumentException("linux-render-test-configuration"); }
    }

    record ProbeBudget(int memoryMiB, int heapMiB, int scratchKiB) {
        ProbeBudget {
            if (memoryMiB < 64 || memoryMiB > 4096 || heapMiB < 64 || heapMiB > 2048
                || scratchKiB < 4 || scratchKiB > 1_048_576) invalid();
        }
    }
    record ProbeState(int exitCode, boolean oomKilled) { }

    private void execute(Path original, Path staging, String entrypoint, List<String> arguments) throws Exception {
        var source = requireFile(original);
        if (!Files.isDirectory(staging, LinkOption.NOFOLLOW_LINKS)) invalid();
        var directory = staging.toRealPath();
        var user = Files.getAttribute(directory, "unix:uid") + ":" + Files.getAttribute(directory, "unix:gid");
        var name = "toonlira-render-linux-" + UUID.randomUUID();
        try {
            // Creation is separate from start: cleanup owns a known container even when the renderer fails.
            command(createArguments(name, user, archive, codecs, source, directory, entrypoint, arguments), Duration.ofSeconds(30));
            command(List.of("start", "--attach", name), Duration.ofSeconds(60));
        } finally {
            // A lost create confirmation must not skip removal of the exact name reserved by this test.
            command(List.of("rm", "--force", name), Duration.ofSeconds(30));
        }
    }

    private void command(List<String> arguments, Duration timeout) throws IOException, InterruptedException {
        if (commandExit(arguments, timeout, null) != 0) throw new AssertionError("linux-render-test-process-failed");
    }

    private void command(List<String> arguments, Duration timeout, Path output) throws IOException, InterruptedException {
        if (commandExit(arguments, timeout, output) != 0) throw new AssertionError("linux-render-test-process-failed");
    }

    private int commandExit(List<String> arguments, Duration timeout, Path output) throws IOException, InterruptedException {
        var command = new ArrayList<String>();
        command.addAll(List.of(docker.toString(), "--config", configuration.toString(), "--host", endpoint));
        command.addAll(arguments);
        var builder = new ProcessBuilder(command).redirectOutput(output == null ? ProcessBuilder.Redirect.DISCARD
            : ProcessBuilder.Redirect.to(output.toFile()))
            .redirectError(ProcessBuilder.Redirect.DISCARD);
        builder.environment().clear();
        var process = builder.start();
        try {
            process.getOutputStream().close();
            if (!process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS)) throw new AssertionError("linux-render-test-timeout");
            return process.exitValue();
        } finally {
            process.destroyForcibly();
            process.waitFor();
        }
    }

    static List<String> createArguments(String name, String user, Path archive, Path codecs, Path original,
                                        Path staging, String entrypoint, List<String> arguments) {
        var result = new ArrayList<String>(List.of("create", "--name", name, "--pull=never", "--network=none",
            "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--pids-limit=64", "--memory=1g",
            "--memory-swap=1g", "--cpus=1", "--user", user, "--workdir", "/work",
            "--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=64m,mode=1777",
            "--mount", mount(archive, "/app/gateway.jar", true), "--mount", mount(codecs, "/codecs", true),
            "--mount", mount(original, "/original", true), "--mount", mount(staging, "/work", false),
            "--entrypoint", entrypoint, IMAGE));
        result.addAll(arguments);
        return List.copyOf(result);
    }

    private static String mount(Path source, String destination, boolean readOnly) {
        if (source == null || !source.isAbsolute() || source.toString().contains(",") || source.toString().contains("\n")) invalid();
        return "type=bind,src=" + source + ",dst=" + destination + (readOnly ? ",readonly" : "");
    }

    private static void selectImage(List<String> arguments, String image) {
        if (!List.of(IMAGE, AMD64_IMAGE, GLIBC_ARM64_IMAGE, GLIBC_AMD64_IMAGE).contains(image)) invalid();
        arguments.set(arguments.indexOf(IMAGE), image);
    }

    static String validateEndpoint(String value) {
        try {
            if (value == null || !value.startsWith("unix:///")) invalid();
            var path = Path.of(value.substring("unix://".length()));
            if (!path.isAbsolute() || !path.normalize().equals(path) || value.contains("\n")) invalid();
            return value;
        } catch (RuntimeException error) { throw new IllegalArgumentException("linux-render-test-configuration"); }
    }

    static Path requireBinary(Path file, String hash) throws Exception {
        var actual = requireFile(file);
        var digest = MessageDigest.getInstance("SHA-256");
        try (var input = Files.newInputStream(actual)) {
            var buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count);
        }
        if (!HexFormat.of().formatHex(digest.digest()).equals(hash) || !Files.isExecutable(actual)) invalid();
        return actual;
    }

    static Path requireDocker(Path path) throws IOException {
        // OrbStack is a multicall executable: canonicalizing argv[0] to docker-tools prevents Docker startup.
        // Resolve/check its target, but keep the explicit local launcher name. Codec pinning remains no-follow.
        if (path == null || !path.isAbsolute() || !Files.isRegularFile(path.toRealPath()) || !Files.isExecutable(path)) invalid();
        return path;
    }

    private static Path requireFile(Path path) throws IOException {
        if (path == null || !path.isAbsolute() || !Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)) invalid();
        return path.toRealPath();
    }

    private static void invalid() { throw new IllegalArgumentException("linux-render-test-configuration"); }

    @Override public void close() throws IOException {
        // The container has terminated; only our generated native directory is made writable for removal.
        if (layoutLibraries != null) Files.setPosixFilePermissions(layoutLibraries, PosixFilePermissions.fromString("rwxr-xr-x"));
        try (var paths = Files.walk(configuration)) {
            for (var path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path);
        }
    }
    @Override public String toString() { return "LinuxRenderContainerFixture[redacted]"; }
}
