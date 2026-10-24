package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.github.dockerjava.api.model.AccessMode;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.Capability;
import com.github.dockerjava.api.model.Volume;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;

/** Uses JAR/native package from the built image, no host override. Providers/tests remain local and synthetic. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.native.image.enabled", matches = "true")
class NativeRenderingWorkerImageLinuxTest {
    private static Network network;
    private static GenericContainer<?> postgres;
    @TempDir Path temporary;

    @BeforeAll static void privatePreparedInfrastructure() throws Exception {
        RenderArchiveNativeTest.requireCurrentArchive();
        network = Network.builder().createNetworkCmdModifier(command -> command.withInternal(true)).build();
        postgres = new GenericContainer<>("postgres:17-alpine").withImagePullPolicy(image -> false)
            .withNetwork(network).withNetworkAliases("postgres")
            .withEnv("POSTGRES_DB", "renderer_probe").withEnv("POSTGRES_USER", "test").withEnv("POSTGRES_PASSWORD", "test")
            .waitingFor(Wait.forLogMessage(".*database system is ready to accept connections.*\\n", 2))
            .withStartupTimeout(Duration.ofSeconds(60));
        postgres.start();
    }
    @AfterAll static void closeOwnedInfrastructure() {
        try { if (postgres != null) postgres.stop(); } finally { if (network != null) network.close(); }
    }

    static Stream<Arguments> packagedMatrix() {
        var scenarios = Stream.concat(
            Stream.of("runtime-format-jpeg", "runtime-format-webp", "runtime-dimension-wide", "runtime-dimension-tall",
                "runtime-dimension-row", "runtime-dimension-column", "runtime-memory-fault", "runtime-disk-fault",
                "runtime-timeout", "runtime-cancel"),
            SyntheticWorkerText.languages().stream().map(language -> "runtime-painted-" + language)).toList();
        return Stream.of(NativeCodecPlatform.ARM64_GLIBC, NativeCodecPlatform.AMD64_GLIBC)
            .flatMap(target -> scenarios.stream().map(scenario -> Arguments.of(target, scenario)));
    }

    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void packagedWorkerKeepsRealLayoutResidentWithLoopbackSdks(NativeCodecPlatform target) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("sdk-layout"));
        String prefix = target == NativeCodecPlatform.ARM64_GLIBC ? "renderer.native.image.arm64" : "renderer.native.image.amd64";
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.nativeImageLayoutWorkerResourceProbe(staging, NativeCodecGlibcLinuxTest.pin(target),
                network.getId(), System.getProperty(prefix + ".id"), target,
                Path.of(System.getProperty("renderer.native.image.layout.model")));
        }
        NativeRenderingWorkerLinuxTest.verifySdkWorker(staging, state, 4);
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        verifyRuntime(metrics);
        assertThat(metrics.path("nativePlatform").textValue()).isEqualTo(target.manifestId());
        assertThat(metrics.path("layoutMode").textValue()).isEqualTo("shadow-real-test-only");
        assertThat(metrics.path("effectiveUid").intValue()).isEqualTo(1000);
        assertThat(metrics.path("imageRenderingDefaultDisabled").booleanValue()).isTrue();
        assertThat(metrics.path("results").get(3).path("layoutStatus").textValue()).isEqualTo("SUCCEEDED");
        for (var result : metrics.path("results")) {
            assertThat(result.path("layoutStatus").textValue()).isIn("SUCCEEDED", "FAILED");
            if (result.path("layoutStatus").textValue().equals("SUCCEEDED")) {
                assertThat(result.path("layoutSha256").textValue()).matches("[a-f0-9]{64}");
                assertThat(result.path("layoutHashesVerified").booleanValue()).isTrue();
            } else assertThat(result.path("layoutError").textValue()).startsWith("layout-");
        }
    }

    @ParameterizedTest(name = "{0}: {1}") @MethodSource("packagedMatrix")
    void packagedArtifactsCoverFormatsScriptsDimensionsAndRecovery(NativeCodecPlatform target, String scenario) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(scenario));
        String prefix = target == NativeCodecPlatform.ARM64_GLIBC ? "renderer.native.image.arm64" : "renderer.native.image.amd64";
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.nativeImageWorkerResourceProbe(staging, NativeCodecGlibcLinuxTest.pin(target),
                network.getId(), System.getProperty(prefix + ".id"), scenario);
        }
        if (scenario.startsWith("runtime-format-"))
            NativeRenderingWorkerLinuxTest.verifyAlternateFormatWorker(staging, state, scenario.substring("runtime-format-".length()));
        else if (scenario.startsWith("runtime-painted-"))
            NativeRenderingWorkerLinuxTest.verifyExtendedWorker(staging, state, scenario.substring("runtime-painted-".length()), null, true);
        else if (scenario.startsWith("runtime-dimension-"))
            NativeRenderingWorkerLinuxTest.verifyExtendedWorker(staging, state, null, scenario.substring("runtime-dimension-".length()));
        else if (scenario.equals("runtime-timeout") || scenario.equals("runtime-cancel"))
            NativeRenderingWorkerLinuxTest.verifyAdmittedTiming(staging, state, scenario.equals("runtime-cancel"));
        else NativeRenderingWorkerLinuxTest.verifyAdmittedFault(staging, state, scenario.equals("runtime-disk-fault"));
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        verifyRuntime(metrics);
        assertThat(metrics.path("nativePlatform").textValue()).isEqualTo(target.manifestId());
        assertThat(metrics.path("imageRenderingDefaultDisabled").booleanValue()).isTrue();
        assertThat(metrics.path("effectiveUid").intValue()).isEqualTo(1000);
    }
    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void packagedArtifactCommitsMaximumReadyAndPreservesSecurityDefaults(NativeCodecPlatform target) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("image-worker"));
        String prefix = target == NativeCodecPlatform.ARM64_GLIBC ? "renderer.native.image.arm64" : "renderer.native.image.amd64";
        var id = System.getProperty(prefix + ".id");
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.nativeImageSdkWorkerResourceProbe(staging, NativeCodecGlibcLinuxTest.pin(target), network.getId(), id);
        }
        NativeRenderingWorkerLinuxTest.verifySdkWorker(staging, state);
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        verifyRuntime(metrics);
        assertThat(metrics.path("nativePlatform").textValue()).isEqualTo(target.manifestId());
        assertThat(metrics.path("imageRenderingDefaultDisabled").isBoolean()).isTrue();
        assertThat(metrics.path("imageRenderingDefaultDisabled").booleanValue()).isTrue();
        assertThat(metrics.path("effectiveUid").intValue()).isEqualTo(1000);
    }

    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void productionEntrypointStartsPrivateWorkerWithNativeRendererAndOcrDisabled(NativeCodecPlatform target) throws Exception {
        String prefix = target == NativeCodecPlatform.ARM64_GLIBC ? "renderer.native.image.arm64" : "renderer.native.image.amd64";
        var id = System.getProperty(prefix + ".id");
        assertThat(id).matches("sha256:[a-f0-9]{64}");
        var directory = Files.createDirectory(temporary.resolve("http-probe"));
        var classFile = directory.resolve(NativeImageHttpProbe.class.getName().replace('.', '/') + ".class");
        Files.createDirectories(classFile.getParent()); Files.write(classFile, LinuxRenderContainerFixture.classBytes(NativeImageHttpProbe.class));
        try (var worker = new GenericContainer<>(id).withImagePullPolicy(image -> false).withNetwork(network)
            .withEnv("SPRING_DATASOURCE_URL", "jdbc:postgresql://postgres:5432/renderer_probe")
            .withEnv("SPRING_DATASOURCE_USERNAME", "test").withEnv("SPRING_DATASOURCE_PASSWORD", "test")
            .withEnv("GATEWAY_RENDERING_MODE", "supervised-native")
            .withCreateContainerCmdModifier(command -> command.getHostConfig().withReadonlyRootfs(true)
                // Direct Docker bind avoids Testcontainers' auxiliary-image mount discovery/pull.
                .withBinds(new Bind(directory.toAbsolutePath().toString(), new Volume("/probe"), AccessMode.ro))
                .withMemory(8L * 1024 * 1024 * 1024).withMemorySwap(8L * 1024 * 1024 * 1024)
                .withPidsLimit(64L).withCpuPeriod(100000L).withCpuQuota(100000L).withCapDrop(Capability.ALL)
                .withSecurityOpts(List.of("no-new-privileges"))
                .withTmpFs(Map.of("/work", "rw,noexec,nosuid,nodev,size=512m,mode=1777", "/tmp", "rw,noexec,nosuid,nodev,size=64m,mode=1777")))
            .waitingFor(Wait.forLogMessage(".*Started TranslationGatewayApplication.*\\n", 1))
            .withStartupTimeout(Duration.ofSeconds(60))) {
            worker.start();
            if ("ubuntu".equals(System.getProperty("renderer.native.image.runtime"))) {
                var runtime = worker.execInContainer("java", "-XshowSettings:properties", "-version");
                assertThat(runtime.getExitCode()).isZero();
                assertThat(runtime.getStderr()).contains("java.vendor = Ubuntu", "java.runtime.version = 25.0.4.1+1-1-24.04.4-Ubuntu");
                var executable = worker.execInContainer("readlink", "-f", "/proc/1/exe");
                assertThat(executable.getExitCode()).isZero();
                assertThat(executable.getStdout().strip()).isEqualTo(NativeImageTestRuntime.configuredExecutable(id));
            }
            assertThat(worker.getContainerInfo().getNetworkSettings().getPorts().getBindings().values())
                .allSatisfy(binding -> assertThat(binding == null || binding.length == 0).isTrue());
            var result = worker.execInContainer("java", "-Xmx64m", "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-cp", "/probe", NativeImageHttpProbe.class.getName());
            assertThat(result.getExitCode()).as("image loopback probe exit").isZero();
            assertThat(result.getStdout().strip()).isEqualTo("{\"health\":200,\"publicRoute\":403,\"disabledOcrTask\":503}");
            var limits = worker.execInContainer("cat", "/proc/1/limits");
            assertThat(LinuxWorkerMemoryAdmission.addressLimit(limits.getStdout())).isEqualTo(NativeWorkerParentLimitMain.CEILING);
            System.out.println("native-image-production-entrypoint " + target.manifestId() + ": health=200 public=403 disabled-ocr=503 parent-AS=3GiB");
        }
    }

    private static void verifyRuntime(JsonNode metrics) {
        if ("ubuntu".equals(System.getProperty("renderer.native.image.runtime"))) {
            assertThat(metrics.path("javaVendor").textValue()).isEqualTo("Ubuntu");
            assertThat(metrics.path("javaRuntimeVersion").textValue()).isEqualTo("25.0.4.1+1-1-24.04.4-Ubuntu");
        }
    }
}
