package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;

/** Application pipeline measured in Linux; providers synthetic, SQL engine in a separate private container. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.worker.resources.enabled", matches = "true")
class NativeRenderingWorkerLinuxTest {
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

    @Test void smallRealWorkerChecksStatesHashesSecurityAndRedelivery() throws Exception {
        verifyScenario("small", 2);
    }

    @Test void acceptedMaximumMediaAndBothTextLimitShapesCompleteSequentiallyInSameContext() throws Exception {
        verifyScenario("maximum", 3);
    }

    @Test void ownedParentAndRendererHaveFiniteAddressCeilingsAndMaximumJobsStillComplete() throws Exception {
        verifyScenario("parent-bounded", 3);
    }

    @Test void productionBootstrapPreparesOwnParentAndCompletesMaximumJobs() throws Exception {
        verifyScenario("runtime-parent", 3);
    }

    @Test void officialLoopbackSdksCompleteMaximumMediaAndOutputInTheBoundedWorker() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("runtime-sdk"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.sdkWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), false);
        }
        verifySdkWorker(staging, state);
    }

    static void verifySdkWorker(Path staging, LinuxRenderContainerFixture.ProbeState state) throws Exception {
        verifySdkWorker(staging, state, 3);
    }

    static void verifySdkWorker(Path staging, LinuxRenderContainerFixture.ProbeState state, int jobs) throws Exception {
        assertThat(jobs).isIn(3, 4);
        assertThat(staging.resolve("resource-metrics.json")).exists();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(state.exitCode()).as("Sanitized SDK worker metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isFalse();
        assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("providerMode").textValue()).isEqualTo("official-sdk-loopback");
        assertThat(metrics.path("visionGrpcCalls").intValue()).isEqualTo(jobs);
        assertThat(metrics.path("translationGrpcCalls").intValue()).isEqualTo(jobs - 1);
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(8L * 1024 * 1024 * 1024);
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive().isLessThanOrEqualTo(8L * 1024 * 1024 * 1024);
        assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomKillCount").longValue()).isZero();
        assertThat(metrics.path("parentPreparation").textValue()).isEqualTo("production-bootstrap");
        assertThat(metrics.path("parentAddressSpaceFinalBytes").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
        assertThat(metrics.path("widthPx").intValue()).isEqualTo(10000);
        assertThat(metrics.path("heightPx").intValue()).isEqualTo(8000);
        assertThat(metrics.path("publicRouteStatus").intValue()).isEqualTo(403);
        assertThat(metrics.path("httpListenerCount").intValue()).isZero();
        assertThat(metrics.path("migrationCount").intValue()).isEqualTo(9);
        assertThat(metrics.path("results").size()).isEqualTo(jobs);
        var maximum = metrics.path("results").get(0);
        assertThat(maximum.path("regions").intValue()).isEqualTo(64);
        assertThat(maximum.path("inputChars").intValue()).isEqualTo(256);
        assertThat(maximum.path("outputChars").intValue()).isEqualTo(8192);
        assertThat(metrics.path("results").get(2).path("regions").intValue()).isZero();
        for (var result : metrics.path("results")) {
            assertThat(result.path("jobStatus").textValue()).isEqualTo("READY");
            assertThat(result.path("succeededStages").intValue()).isEqualTo(3);
            assertThat(result.path("imageSha256").textValue()).matches("[0-9a-f]{64}");
            assertThat(result.path("manifestSha256").textValue()).matches("[0-9a-f]{64}");
        }
        System.out.println("worker-sdk-loopback-synthetic " + metrics);
    }

    @ParameterizedTest @ValueSource(strings = {"jpeg", "webp"})
    void admittedWorkerCompletesMaximumAlternateInputFormats(String format) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("format-" + format));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.alternateFormatWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), false, format);
        }
        verifyAlternateFormatWorker(staging, state, format);
    }

    static void verifyAlternateFormatWorker(Path staging, LinuxRenderContainerFixture.ProbeState state, String format) throws Exception {
        assertThat(staging.resolve("resource-metrics.json")).exists();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(state.exitCode()).as("Sanitized alternate format metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isFalse();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("inputMimeType").textValue()).isEqualTo("image/" + format);
        assertThat(metrics.path("widthPx").intValue()).isEqualTo(10000); assertThat(metrics.path("heightPx").intValue()).isEqualTo(8000);
        assertThat(metrics.path("originalBytes").longValue()).isPositive().isLessThanOrEqualTo(12L * 1024 * 1024);
        assertThat(metrics.path("parentPreparation").textValue()).isEqualTo("production-bootstrap");
        assertThat(metrics.path("renderChildHeapMiB").intValue()).isEqualTo(128);
        assertThat(metrics.path("parentAddressSpaceFinalBytes").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
        assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue(); assertThat(metrics.path("oomKillCount").longValue()).isZero();
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(8L * 1024 * 1024 * 1024);
        assertThat(metrics.path("results").size()).isEqualTo(3);
        assertThat(metrics.path("results").get(0).path("regions").intValue()).isZero();
        assertThat(metrics.path("results").get(1).path("regions").intValue()).isEqualTo(1);
        assertThat(metrics.path("results").get(1).path("overflowRegions").isIntegralNumber()).isTrue();
        assertThat(metrics.path("results").get(1).path("overflowRegions").intValue()).isZero();
        assertThat(metrics.path("results").get(1).path("imageSha256").textValue())
            .isNotEqualTo(metrics.path("results").get(0).path("imageSha256").textValue());
        assertThat(metrics.path("results").get(2).path("regions").intValue()).isEqualTo(1024);
        for (var result : metrics.path("results")) {
            assertThat(result.path("jobStatus").textValue()).isEqualTo("READY");
            assertThat(result.path("succeededStages").intValue()).isEqualTo(3);
            assertThat(result.path("imageSha256").textValue()).matches("[a-f0-9]{64}");
        }
        System.out.println("worker-admitted-synthetic format: " + metrics);
    }

    @ParameterizedTest @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void admittedWorkerCompletesBothUnicodeTextLimitShapes(String language) throws Exception {
        verifyExtended(language, null);
    }

    @ParameterizedTest @ValueSource(strings = {"wide", "tall", "row", "column"})
    void admittedWorkerCompletesMaximumAndOnePixelDimensionShapes(String shape) throws Exception {
        verifyExtended(null, shape);
    }

    @ParameterizedTest @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void admittedWorkerPaintsFittingUnicodeTextAtMaximumPixels(String language) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("painted-" + language));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.paintedScriptWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), false, language);
        }
        verifyExtendedWorker(staging, state, language, null, true);
    }

    private void verifyExtended(String language, String shape) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(language == null ? "dimensions-" + shape : "script-" + language));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.extendedWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), false, language, shape);
        }
        verifyExtendedWorker(staging, state, language, shape);
    }

    static void verifyExtendedWorker(Path staging, LinuxRenderContainerFixture.ProbeState state, String language, String shape) throws Exception {
        verifyExtendedWorker(staging, state, language, shape, false);
    }

    static void verifyExtendedWorker(Path staging, LinuxRenderContainerFixture.ProbeState state, String language, String shape, boolean painted) throws Exception {
        assertThat(staging.resolve("resource-metrics.json")).exists();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(state.exitCode()).as("Sanitized extended worker metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isFalse();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("parentPreparation").textValue()).isEqualTo("production-bootstrap");
        assertThat(metrics.path("parentAddressSpaceFinalBytes").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(8L * 1024 * 1024 * 1024);
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive().isLessThanOrEqualTo(8L * 1024 * 1024 * 1024);
        assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue(); assertThat(metrics.path("oomKillCount").longValue()).isZero();
        assertThat(metrics.path("publicRouteStatus").intValue()).isEqualTo(403);
        assertThat(metrics.path("httpListenerCount").intValue()).isZero();
        assertThat(metrics.path("results").size()).isEqualTo(painted ? 1 : 2);
        if (language != null) {
            assertThat(metrics.path("targetLanguage").textValue()).isEqualTo(language);
            assertThat(metrics.path("widthPx").intValue()).isEqualTo(10000); assertThat(metrics.path("heightPx").intValue()).isEqualTo(8000);
            if (painted) {
                assertThat(metrics.path("results").get(0).path("regions").intValue()).isEqualTo(1);
                assertThat(metrics.path("results").get(0).path("outputChars").intValue()).isEqualTo(32);
                assertThat(metrics.path("results").get(0).path("overflowRegions").isIntegralNumber()).isTrue();
                assertThat(metrics.path("results").get(0).path("overflowRegions").intValue()).isZero();
                assertThat(metrics.path("results").get(0).path("imageSha256").textValue())
                    .isNotEqualTo("4dde8173d1a5128e283f152e29120d9f15a225e7a0b10c60317f86cc741c3e4c");
            } else {
                assertThat(metrics.path("results").get(0).path("regions").intValue()).isEqualTo(1024);
                assertThat(metrics.path("results").get(0).path("outputChars").intValue()).isEqualTo(512);
                assertThat(metrics.path("results").get(1).path("regions").intValue()).isEqualTo(64);
                assertThat(metrics.path("results").get(1).path("outputChars").intValue()).isEqualTo(8192);
            }
        } else {
            int width = switch (shape) { case "wide", "row" -> 12000; case "tall" -> 6666; case "column" -> 1; default -> throw new AssertionError("unknown-shape"); };
            int height = switch (shape) { case "tall", "column" -> 12000; case "wide" -> 6666; case "row" -> 1; default -> throw new AssertionError("unknown-shape"); };
            assertThat(metrics.path("widthPx").intValue()).isEqualTo(width); assertThat(metrics.path("heightPx").intValue()).isEqualTo(height);
        }
        for (var result : metrics.path("results")) {
            assertThat(result.path("jobStatus").textValue()).isEqualTo("READY");
            assertThat(result.path("succeededStages").intValue()).isEqualTo(3);
            assertThat(result.path("imageSha256").textValue()).matches("[a-f0-9]{64}");
            assertThat(result.path("manifestSha256").textValue()).matches("[a-f0-9]{64}");
        }
        System.out.println("worker-admitted-synthetic extended: " + metrics);
    }

    @RepeatedTest(3) void admittedWorkerIsolatesAllocationFailureAndRecoversFollowingPage() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("admitted-memory-fault"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.admittedFaultWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), false);
        }
        verifyAdmittedFault(staging, state);
    }

    @RepeatedTest(3) void admittedWorkerCleansExhaustedScratchAndRecoversFollowingPage() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("admitted-disk-fault"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.admittedDiskFaultWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), false);
        }
        verifyAdmittedFault(staging, state, true);
    }

    @RepeatedTest(3) void admittedWorkerTimesOutWithoutReleasingLiveChildOrInputAndRecovers() throws Exception {
        verifyTimingScenario(false);
    }

    @RepeatedTest(3) void admittedWorkerHonorsConcurrentCancellationBeforeCommitAndRecovers() throws Exception {
        verifyTimingScenario(true);
    }

    private void verifyTimingScenario(boolean cancellation) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(cancellation ? "admitted-cancel" : "admitted-timeout"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.admittedTimingWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), false, cancellation);
        }
        verifyAdmittedTiming(staging, state, cancellation);
    }

    static void verifyAdmittedTiming(Path staging, LinuxRenderContainerFixture.ProbeState state, boolean cancellation) throws Exception {
        assertThat(staging.resolve("resource-metrics.json")).exists();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(state.exitCode()).as("Sanitized timing metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isFalse();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("scenario").textValue()).isEqualTo(cancellation ? "runtime-cancel" : "runtime-timeout");
        assertThat(metrics.path("parentPreparation").textValue()).isEqualTo("production-bootstrap");
        assertThat(metrics.path("parentAddressSpaceFinalBytes").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
        for (var name : List.of("busyRejectedWhileOwned", "pausedOwnedChildObserved", "noLiveChildrenAfterCleanup")) {
            assertThat(metrics.path(name).isBoolean()).isTrue(); assertThat(metrics.path(name).booleanValue()).isTrue();
        }
        assertThat(metrics.path("childLaunches").intValue()).isEqualTo(2);
        assertThat(metrics.path("faultInjections").intValue()).isEqualTo(1);
        assertThat(metrics.path("firstChildExit").isIntegralNumber()).isTrue();
        if (cancellation) {
            assertThat(metrics.path("firstChildExit").intValue()).isZero();
            assertThat(metrics.path("cancelPendingWhileRunning").booleanValue()).isTrue();
        } else {
            assertThat(metrics.path("firstChildExit").intValue()).isNotZero();
            assertThat(metrics.path("inputPreservedAfterCallerTimeout").booleanValue()).isTrue();
            assertThat(metrics.path("callerReturnedBeforeChildRelease").booleanValue()).isTrue();
        }
        assertThat(metrics.path("secondChildExit").isIntegralNumber()).isTrue();
        assertThat(metrics.path("secondChildExit").intValue()).isZero();
        assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomKillCount").longValue()).isZero();
        assertThat(metrics.path("results").size()).isEqualTo(2);
        assertThat(metrics.path("results").get(0).path("jobStatus").textValue()).isEqualTo(cancellation ? "CANCELLED" : "FAILED");
        assertThat(metrics.path("results").get(0).path("artifactsAbsent").booleanValue()).isTrue();
        assertThat(metrics.path("results").get(1).path("jobStatus").textValue()).isEqualTo("READY");
        assertThat(metrics.path("results").get(1).path("succeededStages").intValue()).isEqualTo(3);
        System.out.println("worker-admitted-synthetic timing: " + metrics);
    }

    static void verifyAdmittedFault(Path staging, LinuxRenderContainerFixture.ProbeState state) throws Exception {
        verifyAdmittedFault(staging, state, false);
    }

    static void verifyAdmittedFault(Path staging, LinuxRenderContainerFixture.ProbeState state, boolean disk) throws Exception {
        assertThat(staging.resolve("resource-metrics.json")).exists();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(state.exitCode()).as("Sanitized admitted fault metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isFalse();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("scenario").textValue()).isEqualTo(disk ? "runtime-disk-fault" : "runtime-memory-fault");
        assertThat(metrics.path("parentPreparation").textValue()).isEqualTo("production-bootstrap");
        assertThat(metrics.path("parentInitiallyUnbounded").booleanValue()).isTrue();
        assertThat(metrics.path("parentAddressSpaceAtBootstrap").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
        assertThat(metrics.path("parentAddressSpaceFinalBytes").longValue()).isEqualTo(NativeWorkerParentLimitMain.CEILING);
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(8L * 1024 * 1024 * 1024);
        assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomKillCount").longValue()).isZero();
        assertThat(metrics.path("childLaunches").intValue()).isEqualTo(2);
        assertThat(metrics.path("faultInjections").intValue()).isEqualTo(1);
        assertThat(metrics.path("firstChildExit").isIntegralNumber()).isTrue();
        assertThat(metrics.path("firstChildExit").intValue()).isNotZero();
        assertThat(metrics.path("secondChildExit").isIntegralNumber()).isTrue();
        assertThat(metrics.path("secondChildExit").intValue()).isZero();
        assertThat(metrics.path("liveRenderingChildren").isBoolean()).isTrue();
        assertThat(metrics.path("liveRenderingChildren").booleanValue()).isFalse();
        assertThat(metrics.path("faultType").textValue()).isEqualTo(disk ? "test-only-owned-scratch-full" : "test-only-child-AS");
        if (disk) {
            assertThat(metrics.path("scratchPressureBytes").isIntegralNumber()).isTrue();
            assertThat(metrics.path("scratchPressureBytes").longValue()).isPositive().isLessThanOrEqualTo(512L * 1024 * 1024);
            assertThat(metrics.path("scratchUsableAtFaultBytes").isIntegralNumber()).isTrue();
            assertThat(metrics.path("scratchUsableAtFaultBytes").longValue()).isZero();
            assertThat(metrics.path("scratchUsableBytes").longValue()).isGreaterThan(metrics.path("scratchPressureBytes").longValue());
        } else assertThat(metrics.path("injectedChildAddressSpaceBytes").longValue()).isEqualTo(AdmittedRenderFaults.FAILURE_ADDRESS_BYTES);
        assertThat(metrics.path("results").size()).isEqualTo(2);
        assertThat(metrics.path("results").get(0).path("jobStatus").textValue()).isEqualTo("FAILED");
        assertThat(metrics.path("results").get(0).path("artifactsAbsent").booleanValue()).isTrue();
        assertThat(metrics.path("results").get(1).path("jobStatus").textValue()).isEqualTo("READY");
        assertThat(metrics.path("results").get(1).path("succeededStages").intValue()).isEqualTo(3);
        assertThat(staging.resolve("parent-before-recovery.marker")).exists();
        assertThat(staging.resolve("parent-after-recovery.marker")).exists();
        System.out.println("worker-admitted-synthetic " + (disk ? "disk-fault: " : "memory-fault: ") + metrics);
    }

    @RepeatedTest(3) void preventiveAddressCeilingFailsMaximumWithoutKernelOomAndRecoversSmallPage() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("address-bounded"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.workerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), "address-bounded", 2048);
        }
        var metricsPath = staging.resolve("resource-metrics.json");
        assertThat(metricsPath).as("Preventive probe exit=%s, oom=%s", state.exitCode(), state.oomKilled()).exists();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(metricsPath));
        assertThat(state.exitCode()).as("Sanitized preventive/recovery metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isFalse();
        assertThat(metrics.path("scenario").textValue()).isEqualTo("address-bounded");
        assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("childAddressSpaceLimitBytes").longValue()).isEqualTo(1536L * 1024 * 1024);
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(2L * 1024 * 1024 * 1024);
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive().isLessThan(2L * 1024 * 1024 * 1024);
        assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomKillCount").longValue()).isZero();
        assertThat(metrics.path("failedJobs").intValue()).isEqualTo(1);
        assertThat(metrics.path("completedJobs").intValue()).isEqualTo(1);
        assertThat(metrics.path("results").size()).isEqualTo(2);
        assertThat(metrics.path("results").get(0).path("artifactsAbsent").booleanValue()).isTrue();
        assertThat(metrics.path("results").get(0).path("jobStatus").textValue()).isEqualTo("FAILED");
        assertThat(metrics.path("results").get(1).path("jobStatus").textValue()).isEqualTo("READY");
        assertThat(staging.resolve("parent-before-recovery.marker")).exists();
        assertThat(staging.resolve("parent-after-recovery.marker")).exists();
        System.out.println("worker-linux-synthetic address-bounded: " + metrics);
    }

    @RepeatedTest(3) void kernelOomFailsOnlyCurrentJobAndFollowingPageCompletesWithoutReplayingProviders() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("memory-fault"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.workerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), network.getId(), "memory-fault", 2048);
        }
        var metricsPath = staging.resolve("resource-metrics.json");
        assertThat(Files.isRegularFile(metricsPath)).as("OOM probe exit=%s, oom=%s, parent reached recovery=%s, recovery completed=%s",
            state.exitCode(), state.oomKilled(), Files.exists(staging.resolve("parent-before-recovery.marker")),
            Files.exists(staging.resolve("parent-after-recovery.marker"))).isTrue();
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(metricsPath));
        assertThat(state.exitCode()).as("Sanitized OOM/recovery metrics: %s", metrics).isZero();
        assertThat(state.oomKilled()).isTrue();
        assertThat(metrics.path("scenario").textValue()).isEqualTo("memory-fault");
        assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("initialParentOomAdjustment").isIntegralNumber()).isTrue();
        assertThat(metrics.path("initialParentOomAdjustment").intValue()).isZero();
        assertThat(metrics.path("finalParentOomAdjustment").isIntegralNumber()).isTrue();
        assertThat(metrics.path("finalParentOomAdjustment").intValue()).isZero();
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(2L * 1024 * 1024 * 1024);
        assertThat(metrics.path("oomGroup").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomGroup").intValue()).isZero();
        assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomKillCount").longValue()).isPositive();
        assertThat(metrics.path("oomGroupKillCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomGroupKillCount").longValue()).isZero();
        assertThat(metrics.path("failedJobs").intValue()).isEqualTo(1);
        assertThat(metrics.path("completedJobs").intValue()).isEqualTo(1);
        assertThat(metrics.path("results").size()).isEqualTo(2);
        var failed = metrics.path("results").get(0);
        assertThat(failed.path("jobStatus").textValue()).isEqualTo("FAILED");
        assertThat(failed.path("renderStageStatus").textValue()).isEqualTo("FAILED");
        assertThat(failed.path("renderErrorCode").textValue()).isEqualTo("internal-error");
        assertThat(failed.path("artifactsAbsent").booleanValue()).isTrue();
        assertThat(metrics.path("results").get(1).path("jobStatus").textValue()).isEqualTo("READY");
        System.out.println("worker-linux-synthetic memory-fault: " + metrics);
    }

    private void verifyScenario(String scenario, int jobs) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(scenario));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = scenario.equals("runtime-parent")
                ? fixture.runtimeParentWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                    System.getProperty("renderer.distribution.sha256"), network.getId(), false)
                : scenario.equals("parent-bounded")
                ? fixture.parentBoundedWorkerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                    System.getProperty("renderer.distribution.sha256"), network.getId(), false)
                : fixture.workerResourceProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                    System.getProperty("renderer.distribution.sha256"), network.getId(), scenario);
        }
        var metricsPath = staging.resolve("resource-metrics.json");
        var metrics = Files.isRegularFile(metricsPath) ? GatewayJsonMapper.create().readTree(Files.readAllBytes(metricsPath)) : null;
        assertThat(state.oomKilled()).as("Worker %s: container exit=%s, budget=%s MiB, sanitized final metrics=%s",
            scenario, state.exitCode(), LinuxRenderContainerFixture.workerMemoryMiB(System.getProperty("renderer.worker.memoryMiB")),
            metrics).isFalse();
        assertThat(metrics).as("Final worker metrics must exist").isNotNull();
        assertThat(metrics.path("phase").textValue()).as("Sanitized local worker metrics: %s", metrics).isEqualTo("complete");
        assertThat(state.exitCode()).as("Sanitized final worker metrics: %s", metrics).isZero();
        assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
        assertThat(metrics.path("providerMode").textValue()).isEqualTo("synthetic-test-only");
        assertThat(metrics.path("completedJobs").intValue()).isEqualTo(jobs);
        long budget = (scenario.equals("parent-bounded") || scenario.equals("runtime-parent") ? 8192
            : LinuxRenderContainerFixture.workerMemoryMiB(System.getProperty("renderer.worker.memoryMiB"))) * 1024L * 1024;
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(budget);
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive().isLessThanOrEqualTo(budget);
        assertThat(metrics.has("httpListenerCount")).isTrue();
        assertThat(metrics.path("httpListenerCount").isIntegralNumber()).isTrue();
        assertThat(metrics.path("httpListenerCount").intValue()).isZero();
        assertThat(metrics.path("httpLocalPorts").isArray()).isTrue();
        for (var port : metrics.path("httpLocalPorts")) assertThat(port.intValue()).isEqualTo(-1);
        assertThat(metrics.path("publicRouteStatus").intValue()).isEqualTo(403);
        assertThat(metrics.path("migrationCount").intValue()).isEqualTo(9);
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
            assertThat(metrics.path("childAddressSpaceLimitBytes").longValue()).isEqualTo(3L * 1024 * 1024 * 1024);
            assertThat(metrics.path("parentVirtualBeforeBytes").longValue()).isPositive().isLessThanOrEqualTo(3L * 1024 * 1024 * 1024);
            assertThat(metrics.path("parentVirtualAfterBytes").longValue()).isPositive().isLessThanOrEqualTo(3L * 1024 * 1024 * 1024);
            assertThat(metrics.path("oomKillCount").isIntegralNumber()).isTrue();
            assertThat(metrics.path("oomKillCount").longValue()).isZero();
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
        System.out.println("worker-linux-synthetic " + scenario + ": " + metrics);
    }
}
