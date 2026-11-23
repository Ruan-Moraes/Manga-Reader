package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;

/** Resource measurements/faults only; no quality claim or admission of a production container budget. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.linux.resources.enabled", matches = "true")
class RenderLinuxResourceTest {
    private static final long MIB = 1024L * 1024;
    @TempDir Path temporary;

    @BeforeAll static void currentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @Test
    void smallPageRecordsActualCgroupAndScratchMeasurementsWithoutInventedRegions() throws Exception {
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            success(fixture, SyntheticResourcePng.write(temporary.resolve("small.png"), 320, 220, false), "small",
                new LinuxRenderContainerFixture.ProbeBudget(1024, 512, 64 * 1024));
        }
    }

    @Test
    void fullEightyMillionPixelPageIsMeasuredWithoutReducingTheInput() throws Exception {
        var original = SyntheticResourcePng.write(temporary.resolve("maximum.png"), 10_000, 8_000, false);
        var metadata = LocalFileRenderAdapterTest.metadata(original);
        assertThat((long) metadata.widthPx() * metadata.heightPx()).isEqualTo(RenderPolicy.MAX_PIXELS);
        assertThat(metadata.byteSize()).isLessThanOrEqualTo(RenderPolicy.MAX_ORIGINAL_BYTES);
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            success(fixture, original, "maximum-flat", new LinuxRenderContainerFixture.ProbeBudget(4096, 1024, 512 * 1024));
        }
    }

    @Test
    void kernelMemoryFailureCannotPublishSuccessOrCorruptTheNextPage() throws Exception {
        var original = SyntheticResourcePng.write(temporary.resolve("memory.png"), 10_000, 8_000, false);
        var before = LocalFileRenderAdapterTest.metadata(original);
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            var staging = prepare(original, "memory-fault");
            var state = fixture.probe(original, staging, new LinuxRenderContainerFixture.ProbeBudget(128, 512, 64 * 1024));
            assertThat(state.oomKilled()).isTrue();
            assertThat(state.exitCode()).isNotZero();
            assertThat(staging.resolve("result.bin")).doesNotExist();
            assertThat(LocalFileRenderAdapterTest.metadata(original)).isEqualTo(before);
            success(fixture, SyntheticResourcePng.write(temporary.resolve("recovery.png"), 320, 220, false), "memory-recovery",
                new LinuxRenderContainerFixture.ProbeBudget(1024, 512, 64 * 1024));
            System.out.println("linux-resource-fault: kernel-oom; no result; following page succeeded");
        }
    }

    @Test
    void currentOneGiBWorkerBudgetIsNotAdmittedForTheMaximumPage() throws Exception {
        var original = SyntheticResourcePng.write(temporary.resolve("worker-budget.png"), 10_000, 8_000, false);
        var before = LocalFileRenderAdapterTest.metadata(original);
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            var staging = prepare(original, "worker-budget-fault");
            var state = fixture.probe(original, staging, new LinuxRenderContainerFixture.ProbeBudget(1024, 1024, 512 * 1024));
            assertThat(state.exitCode()).isNotZero();
            assertThat(state.oomKilled()).isTrue();
            assertThat(staging.resolve("result.bin")).doesNotExist();
            assertThat(LocalFileRenderAdapterTest.metadata(original)).isEqualTo(before);
            System.out.println("linux-resource-fault: maximum page with 1GiB; kernel OOM; no result");
        }
    }

    @Test
    void boundedScratchFailureCannotPublishSuccessOrCorruptTheNextPage() throws Exception {
        var original = SyntheticResourcePng.write(temporary.resolve("disk.png"), 1200, 800, true);
        var before = LocalFileRenderAdapterTest.metadata(original);
        assertThat(before.byteSize()).isGreaterThan(16 * 1024);
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            var staging = prepare(original, "disk-fault");
            var state = fixture.probe(original, staging, new LinuxRenderContainerFixture.ProbeBudget(1024, 512, 16));
            assertThat(state.oomKilled()).isFalse();
            assertThat(state.exitCode()).isEqualTo(1);
            assertThat(staging.resolve("result.bin")).doesNotExist();
            var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
            assertThat(metrics.path("outcome").textValue()).isEqualTo("failed");
            assertThat(metrics.path("scratchCapacityBytes").longValue()).isEqualTo(16 * 1024);
            assertThat(LocalFileRenderAdapterTest.metadata(original)).isEqualTo(before);
            success(fixture, SyntheticResourcePng.write(temporary.resolve("disk-recovery.png"), 320, 220, false), "disk-recovery",
                new LinuxRenderContainerFixture.ProbeBudget(1024, 512, 64 * 1024));
            System.out.println("linux-resource-fault: bounded scratch; no result; following page succeeded");
        }
    }

    private void success(LinuxRenderContainerFixture fixture, Path original, String label,
                         LinuxRenderContainerFixture.ProbeBudget budget) throws Exception {
        var before = LocalFileRenderAdapterTest.metadata(original);
        var staging = prepare(original, label);
        var state = fixture.probe(original, staging, budget);
        assertThat(state.exitCode()).isZero();
        assertThat(state.oomKilled()).isFalse();
        var request = LocalFileRenderAdapterTest.request(before, List.of(), RenderPolicy.initial());
        var output = RenderSubprocessProtocol.readResult(staging.resolve("result.bin"), staging, request);
        assertThat(output.manifest().regions()).isEmpty();
        var image = output.manifest().image();
        assertThat(LocalFileRenderAdapterTest.metadata(output.path())).isEqualTo(
            new RenderSource(image.mimeType(), image.byteSize(), image.widthPx(), image.heightPx(), image.sha256()));
        assertThat(LocalFileRenderAdapterTest.metadata(original)).isEqualTo(before);
        var codec = new RenderManifestService(GatewayJsonMapper.create());
        var manifest = codec.encode(output.manifest(), request.policy());
        var decoded = codec.decode(manifest.bytes(), manifest.sha256(), request, output.manifest().image());
        assertThat(codec.encode(decoded, request.policy()).bytes()).containsExactly(manifest.bytes());
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
        for (var name : List.of("memoryLimitBytes", "swapLimitBytes", "memoryPeakBytes", "jvmPeakRssKiB",
            "scratchCapacityBytes", "elapsedNanos")) assertThat(metrics.path(name).isIntegralNumber()).isTrue();
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(budget.memoryMiB() * MIB);
        assertThat(metrics.path("swapLimitBytes").longValue()).isZero();
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive();
        assertThat(metrics.path("jvmPeakRssKiB").longValue()).isPositive();
        assertThat(metrics.path("scratchCapacityBytes").longValue()).isEqualTo(budget.scratchKiB() * 1024L);
        assertThat(metrics.path("elapsedNanos").longValue()).isPositive();
        System.out.println("linux-resource-measurement " + label + ": " + metrics);
    }

    private Path prepare(Path original, String label) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(label));
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var settings = new RenderChildSettings(Path.of("/codecs/cwebp"), LinuxRenderContainerFixture.ENCODER_SHA256,
            Path.of("/codecs/dwebp"), LinuxRenderContainerFixture.DECODER_SHA256, Duration.ofSeconds(60));
        RenderSubprocessProtocol.writeRequest(staging.resolve("request.bin"), Path.of("/original"), settings, request);
        return staging;
    }
}
