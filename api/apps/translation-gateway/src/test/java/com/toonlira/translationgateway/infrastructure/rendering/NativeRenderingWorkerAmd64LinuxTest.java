package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;

/** AMD64 execution under local emulation: functional proof, not cloud/native-hardware profiling. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.amd64.enabled", matches = "true")
class NativeRenderingWorkerAmd64LinuxTest {
    private static Network network;
    private static GenericContainer<?> postgres;
    @TempDir Path temporary;

    @BeforeAll static void preparedContainersOnly() throws Exception {
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

    @Test void smallAmd64WorkerPreservesStatesFilesSecurityAndRedelivery() throws Exception { verify("small", 2); }
    @Test void maximumAmd64WorkerCompletesAllThreeAcceptedLimitShapes() throws Exception { verify("maximum", 3); }
    @Test void parentBoundedAmd64WorkerCompletesMaximumJobsWithoutChangingQuality() throws Exception { verify("parent-bounded", 3); }
    @Test void productionBootstrapAmd64PreparesOwnParentAndCompletesMaximumJobs() throws Exception { verify("runtime-parent", 3); }

    @Test void officialLoopbackSdksCompleteMaximumMediaAndOutputInTheBoundedAmd64Worker() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("runtime-sdk"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.sdkWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true);
        }
        NativeRenderingWorkerLinuxTest.verifySdkWorker(staging, state);
    }

    @ParameterizedTest @ValueSource(strings = {"jpeg", "webp"})
    void admittedAmd64WorkerCompletesMaximumAlternateInputFormats(String format) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("format-" + format));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.alternateFormatWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true, format);
        }
        NativeRenderingWorkerLinuxTest.verifyAlternateFormatWorker(staging, state, format);
    }

    @ParameterizedTest @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void admittedAmd64WorkerCompletesBothUnicodeTextLimitShapes(String language) throws Exception { verifyExtended(language, null); }

    @ParameterizedTest @ValueSource(strings = {"wide", "tall", "row", "column"})
    void admittedAmd64WorkerCompletesMaximumAndOnePixelDimensionShapes(String shape) throws Exception { verifyExtended(null, shape); }

    @ParameterizedTest @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void admittedAmd64WorkerPaintsFittingUnicodeTextAtMaximumPixels(String language) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("painted-" + language));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.paintedScriptWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true, language);
        }
        NativeRenderingWorkerLinuxTest.verifyExtendedWorker(staging, state, language, null, true);
    }

    private void verifyExtended(String language, String shape) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(language == null ? "dimensions-" + shape : "script-" + language));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.extendedWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true, language, shape);
        }
        NativeRenderingWorkerLinuxTest.verifyExtendedWorker(staging, state, language, shape);
    }

    @Test void admittedAmd64WorkerIsolatesAllocationFailureAndRecoversFollowingPage() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("admitted-memory-fault"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.admittedFaultWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true);
        }
        NativeRenderingWorkerLinuxTest.verifyAdmittedFault(staging, state);
    }

    @Test void admittedAmd64WorkerCleansExhaustedScratchAndRecoversFollowingPage() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("admitted-disk-fault"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.admittedDiskFaultWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true);
        }
        NativeRenderingWorkerLinuxTest.verifyAdmittedFault(staging, state, true);
    }

    @Test void admittedAmd64WorkerTimesOutWithoutReleasingLiveChildOrInputAndRecovers() throws Exception { verifyTiming(false); }
    @Test void admittedAmd64WorkerHonorsConcurrentCancellationBeforeCommitAndRecovers() throws Exception { verifyTiming(true); }

    private void verifyTiming(boolean cancellation) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(cancellation ? "admitted-cancel" : "admitted-timeout"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.admittedTimingWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true, cancellation);
        }
        NativeRenderingWorkerLinuxTest.verifyAdmittedTiming(staging, state, cancellation);
    }

    private void verify(String scenario, int jobs) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(scenario));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = scenario.equals("runtime-parent")
                ? fixture.runtimeParentWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                    System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true)
                : scenario.equals("parent-bounded")
                ? fixture.parentBoundedWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                    System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), true)
                : fixture.amd64WorkerResourceProbe(staging, Path.of(System.getProperty("renderer.amd64.distribution.directory")),
                    System.getProperty("renderer.amd64.distribution.sha256"), network.getId(), scenario);
        }
        assertThat(staging.resolve("resource-metrics.json")).as("AMD64 worker exit=%s, oom=%s", state.exitCode(), state.oomKilled()).exists();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(state.exitCode()).as("Sanitized AMD64 worker metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isFalse();
        assertThat(metrics.path("nativePlatform").textValue()).isEqualTo("linux-x86_64-musl");
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
        assertThat(metrics.path("providerMode").textValue()).isEqualTo("synthetic-test-only");
        long budget = (scenario.equals("parent-bounded") || scenario.equals("runtime-parent") ? 8L : 4L) * 1024 * 1024 * 1024;
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(budget);
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive().isLessThanOrEqualTo(budget);
        assertThat(metrics.path("httpListenerCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("httpListenerCount").intValue()).isZero();
        assertThat(metrics.path("publicRouteStatus").intValue()).isEqualTo(403);
        assertThat(metrics.path("migrationCount").intValue()).isEqualTo(9);
        assertThat(metrics.path("completedJobs").intValue()).isEqualTo(jobs);
        assertThat(metrics.path("results").size()).isEqualTo(jobs);
        for (var result : metrics.path("results")) {
            assertThat(result.path("jobStatus").textValue()).isEqualTo("READY");
            assertThat(result.path("succeededStages").intValue()).isEqualTo(3);
            assertThat(result.path("imageSha256").textValue()).matches("[0-9a-f]{64}");
            assertThat(result.path("manifestSha256").textValue()).matches("[0-9a-f]{64}");
        }
        if (scenario.equals("maximum") || scenario.equals("parent-bounded") || scenario.equals("runtime-parent")) {
            assertThat(metrics.path("results").get(0).path("regions").intValue()).isEqualTo(1024);
            assertThat(metrics.path("results").get(1).path("regions").intValue()).isEqualTo(64);
            assertThat(metrics.path("results").get(2).path("regions").intValue()).isZero();
        }
        if (scenario.equals("parent-bounded")) {
            assertThat(metrics.path("parentIdentityConfirmed").booleanValue()).isTrue();
            assertThat(metrics.path("parentAddressSpaceLimitBytes").longValue()).isEqualTo(3L * 1024 * 1024 * 1024);
            assertThat(metrics.path("parentVirtualBeforeBytes").longValue()).isPositive().isLessThanOrEqualTo(3L * 1024 * 1024 * 1024);
            assertThat(metrics.path("parentVirtualAfterBytes").longValue()).isPositive().isLessThanOrEqualTo(3L * 1024 * 1024 * 1024);
        }
        if (scenario.equals("runtime-parent")) {
            assertThat(metrics.path("parentInitiallyUnbounded").isBoolean()).isTrue();
            assertThat(metrics.path("parentInitiallyUnbounded").booleanValue()).isTrue();
            assertThat(metrics.path("parentNativeAccessFlag").isBoolean()).isTrue();
            assertThat(metrics.path("parentNativeAccessFlag").booleanValue()).isFalse();
            assertThat(metrics.path("parentPreparation").textValue()).isEqualTo("production-bootstrap");
            assertThat(metrics.path("parentAddressSpaceAtBootstrap").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
            assertThat(metrics.path("parentAddressSpaceFinalBytes").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
            assertThat(metrics.path("liveHelperAtBootstrap").isBoolean()).isTrue();
            assertThat(metrics.path("liveHelperAtBootstrap").booleanValue()).isFalse();
            assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue();
            assertThat(metrics.path("oomKillCount").longValue()).isZero();
        }
        System.out.println("worker-amd64-synthetic " + scenario + ": " + metrics);
    }
}
