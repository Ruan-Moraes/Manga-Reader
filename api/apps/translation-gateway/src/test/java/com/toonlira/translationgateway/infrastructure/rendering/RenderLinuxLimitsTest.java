package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;

@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.distribution.enabled", matches = "true")
class RenderLinuxLimitsTest {
    @TempDir Path temporary;
    @BeforeAll static void currentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @Test void inspectBaselineVirtualReservationsBeforeSelectingKernelBudget() throws Exception {
        var directory = Files.createDirectory(temporary.resolve("inspect"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.inspectOwnLimits(directory); }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(directory.resolve("limits.json")));
        assertThat(metrics.path("VmSize:").longValue()).isPositive();
        assertThat(metrics.path("resource-9").get(0).longValue()).isEqualTo(-1);
        assertThat(metrics.path("oomScoreAdjustment").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomScoreAdjustment").intValue()).isZero();
        System.out.println("limits-baseline-synthetic " + metrics);
    }

    @Test void unprivilegedGuardIsConfirmedByKernelBeforeDecode() throws Exception {
        var directory = Files.createDirectory(temporary.resolve("guard"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            assertThat(fixture.limitsProbe(directory, "guard")).isZero();
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(directory.resolve("limits.json")));
        assertThat(metrics.path("resource-9").get(0).longValue()).isEqualTo(NativeProcessLimits.initial().addressSpaceBytes());
        assertThat(metrics.path("resource-9").get(1).longValue()).isEqualTo(NativeProcessLimits.initial().addressSpaceBytes());
        assertThat(metrics.path("resource-0").get(0).longValue()).isEqualTo(120);
        assertThat(metrics.path("resource-1").get(0).longValue()).isEqualTo(64L * 1024 * 1024);
        assertThat(metrics.path("resource-4").get(1).longValue()).isZero();
        assertThat(metrics.path("resource-7").get(0).longValue()).isEqualTo(128);
        assertThat(metrics.has("dumpable")).isTrue();
        assertThat(metrics.path("dumpable").isIntegralNumber()).isTrue();
        assertThat(metrics.path("dumpable").intValue()).isZero();
        assertThat(metrics.path("oomScoreAdjustment").isIntegralNumber()).isTrue();
        assertThat(metrics.path("oomScoreAdjustment").intValue()).isEqualTo(1000);
        assertThat(GatewayJsonMapper.create().readTree(Files.readAllBytes(directory.resolve("container-state.json")))
            .path("oomKilled").booleanValue()).isFalse();
        System.out.println("limits-guard-synthetic " + metrics);
    }

    @Test void fatalNativeSignalHasDumpabilityDisabledAndProducesNoCoreOrCrashFile() throws Exception {
        var directory = Files.createDirectory(temporary.resolve("crash"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            assertThat(fixture.limitsProbe(directory, "crash")).isPositive();
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(directory.resolve("limits.json")));
        assertThat(metrics.has("dumpable")).isTrue();
        assertThat(metrics.path("dumpable").isIntegralNumber()).isTrue();
        assertThat(metrics.path("dumpable").intValue()).isZero();
        var state = GatewayJsonMapper.create().readTree(Files.readAllBytes(directory.resolve("container-state.json")));
        assertThat(directory.resolve("crash-returned.txt")).doesNotExist();
        assertThat(Files.readString(directory.resolve("crash-started.txt"))).isEqualTo("native-abort");
        // The pinned HotSpot/musl runtime terminates this non-returning native abort as SIGSEGV, not SIGABRT.
        assertThat(state.path("exitCode").intValue()).isEqualTo(139);
        assertThat(state.path("oomKilled").booleanValue()).isFalse();
        try (var files = Files.list(directory)) {
            assertThat(files.map(path -> path.getFileName().toString()).toList())
                .containsExactlyInAnyOrder("limits.json", "container-state.json", "crash-started.txt");
        }
    }

    @Test void excessNativeVirtualAllocationIsDeniedWithoutKillingParentOrCgroup() throws Exception {
        var directory = Files.createDirectory(temporary.resolve("address"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            assertThat(fixture.limitsProbe(directory, "address")).isZero();
        }
        assertThat(Files.readString(directory.resolve("address-denied.txt"))).isEqualTo("denied-without-oom");
    }

    @Test void fileGrowthIsStoppedAndCpuLoopIsTerminatedWithoutCgroupOom() throws Exception {
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            for (var mode : new String[]{"file", "cpu"}) {
                var directory = Files.createDirectory(temporary.resolve(mode));
                assertThat(fixture.limitsProbe(directory, mode)).isPositive();
                assertThat(directory.resolve("limits.json")).exists();
                assertThat(directory.resolve("unexpected-success.txt")).doesNotExist();
                var state = GatewayJsonMapper.create().readTree(Files.readAllBytes(directory.resolve("container-state.json")));
                assertThat(state.path("oomKilled").booleanValue()).isFalse();
                if (mode.equals("file")) assertThat(Files.size(directory.resolve("oversized.bin"))).isLessThanOrEqualTo(8192);
                else assertThat(state.path("exitCode").intValue()).isEqualTo(137);
            }
        }
    }
}
