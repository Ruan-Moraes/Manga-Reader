package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Evidence probe, not admission of a production codec or container budget. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.shared.resources.enabled", matches = "true")
class NativeRenderResourceTest {
    @TempDir Path temporary;
    @BeforeAll static void currentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @Test void smallPageCompletesExactRoundTripWithoutNetwork() throws Exception {
        measure(SyntheticResourcePng.multicolor(temporary.resolve("small.png"), 320, 220), "small",
            new LinuxRenderContainerFixture.ProbeBudget(1024, 256, 64 * 1024), true);
    }

    @Test void maximumJpegCompletesWithProductionChildLimitsAndReportsItsPhase() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("maximum-jpeg-bounded"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.maximumJpegPhaseProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), false, NativeProcessLimits.initial().addressSpaceBytes(),
                new GatewayProperties().getRendering().getChildHeapMiB());
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        System.out.println("native-jpeg-bounded-phases: " + metrics);
        assertThat(metrics.path("originalSha256").textValue()).isEqualTo("f0cd20201a8d9e6f69a05ef0bc18c1f49a4672a134cde52813d809db4e535522");
        assertThat(metrics.path("childAddressSpaceLimitBytes").longValue()).isEqualTo(NativeProcessLimits.initial().addressSpaceBytes());
        assertThat(state.oomKilled()).isFalse();
        assertThat(state.exitCode()).as("Sanitized bounded JPEG phases: %s", metrics).isZero();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("pixelRoundTripExact").booleanValue()).isTrue();
    }

    @Test void largerAddressSpaceIsOnlyADiagnosticControlForTheSameJpeg() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("maximum-jpeg-diagnostic-4g"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.maximumJpegPhaseProbe(staging, Path.of(System.getProperty("renderer.distribution.directory")),
                System.getProperty("renderer.distribution.sha256"), false, 4L * 1024 * 1024 * 1024);
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        System.out.println("native-jpeg-diagnostic-4g: " + metrics);
        assertThat(metrics.path("originalSha256").textValue()).isEqualTo("f0cd20201a8d9e6f69a05ef0bc18c1f49a4672a134cde52813d809db4e535522");
        assertThat(metrics.path("childAddressSpaceLimitBytes").longValue()).isEqualTo(4L * 1024 * 1024 * 1024);
        assertThat(metrics.path("largerAddressDiagnostic").booleanValue()).isTrue();
        assertThat(state.oomKilled()).isFalse();
        assertThat(state.exitCode()).as("Sanitized diagnostic control: %s", metrics).isZero();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("pixelRoundTripExact").booleanValue()).isTrue();
    }

    @ParameterizedTest @ValueSource(ints = {64, 128})
    void smallerHeapDoesNotRaiseTheProductionAddressCapOrChangePixels(int heapMiB) throws Exception {
        measureReducedHeap(heapMiB, false);
    }

    @ParameterizedTest @ValueSource(ints = {64, 128})
    void amd64HeapControlsReportPhaseAndDoNotRaiseTheAddressCap(int heapMiB) throws Exception {
        measureReducedHeap(heapMiB, true);
    }

    private void measureReducedHeap(int heapMiB, boolean amd64) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("maximum-jpeg-heap-" + heapMiB));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.maximumJpegPhaseProbe(staging, Path.of(System.getProperty(amd64 ? "renderer.amd64.distribution.directory" : "renderer.distribution.directory")),
                System.getProperty(amd64 ? "renderer.amd64.distribution.sha256" : "renderer.distribution.sha256"), amd64,
                NativeProcessLimits.initial().addressSpaceBytes(), heapMiB);
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        System.out.println("native-jpeg-diagnostic-heap: " + metrics);
        assertThat(metrics.path("childHeapMaximumBytes").longValue()).isPositive().isLessThanOrEqualTo(heapMiB * 1024L * 1024);
        assertThat(metrics.path("largerAddressDiagnostic").booleanValue()).isFalse();
        assertThat(metrics.path("childAddressSpaceLimitBytes").longValue()).isEqualTo(NativeProcessLimits.initial().addressSpaceBytes());
        assertThat(state.oomKilled()).isFalse();
        assertThat(state.exitCode()).as("Sanitized reduced heap diagnostic: %s", metrics).isZero();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("pixelRoundTripExact").booleanValue()).isTrue();
        assertThat(metrics.path("outputSha256").textValue()).isEqualTo("59d836302cba3639acd0139c1452affcdec1abe29fc99352f2097a80e0251952");
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void experimentalCompressionMethodZeroKeepsEveryPixelAndAllLimits(boolean amd64) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("experimental-method0"));
        LinuxRenderContainerFixture.ProbeState state;
        String prefix = amd64 ? "renderer.amd64.distribution." : "renderer.distribution.";
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.maximumJpegPhaseProbe(staging, Path.of(System.getProperty(prefix + "directory")),
                System.getProperty(prefix + "sha256"), amd64, NativeProcessLimits.initial().addressSpaceBytes(), 128, 0);
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        System.out.println("native-jpeg-experimental-method0: " + metrics);
        assertThat(metrics.path("experimentalEncoding").booleanValue()).isTrue();
        assertThat(metrics.path("compressionMethod").intValue()).isZero();
        assertThat(metrics.path("childAddressSpaceLimitBytes").longValue()).isEqualTo(NativeProcessLimits.initial().addressSpaceBytes());
        assertThat(metrics.path("originalSha256").textValue()).isEqualTo("f0cd20201a8d9e6f69a05ef0bc18c1f49a4672a134cde52813d809db4e535522");
        assertThat(state.oomKilled()).isFalse();
        assertThat(state.exitCode()).as("Experimental only, not active policy approval: %s", metrics).isZero();
        assertThat(metrics.path("phase").textValue()).isEqualTo("complete");
        assertThat(metrics.path("pixelRoundTripExact").booleanValue()).isTrue();
        assertThat(metrics.path("outputBytes").longValue()).isPositive().isLessThanOrEqualTo(RenderPolicy.MAX_OUTPUT_BYTES);
    }

    @Test void paintedNativeSurfaceMatchesExistingCompositorAndIndependentCli() throws Exception {
        var original = SyntheticResourcePng.multicolor(temporary.resolve("composed.png"), 320, 220);
        var regions = List.of(new OcrManifest.Region(new UUID(0, 1), 0, "synthetic",
            CleanBoxPainterTest.rectangle(.1, .1, .9, .9)));
        measure(original, "composed", new LinuxRenderContainerFixture.ProbeBudget(1024, 256, 64 * 1024), true, regions);
        var staging = temporary.resolve("composed");
        try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.decode(staging.resolve("render-probe.webp"), staging); }
        var inspector = new MediaInspectionService();
        MediaInspectionService.InspectedMedia media;
        try (var stream = Files.newInputStream(original)) { media = inspector.inspect(stream, RenderPolicy.MAX_ORIGINAL_BYTES); }
        var expected = new ValidatedRasterDecoder(null).decode(media, RenderPolicy.initial());
        inspector.deleteQuietly(media.path());
        var actual = ImageIO.read(staging.resolve("decoded.png").toFile());
        try {
            var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), regions, RenderPolicy.initial());
            new PageRasterPainter(new BundledRenderingFonts()).paint(expected, request);
            for (int y = 0; y < 220; y++) for (int x = 0; x < 320; x++)
                assertThat(actual.getRGB(x, y)).isEqualTo(expected.getRGB(x, y));
        } finally { expected.flush(); actual.flush(); }
    }

    @Test void maximumFlatPageIsMeasuredWithoutReducingInput() throws Exception {
        measure(SyntheticResourcePng.write(temporary.resolve("flat.png"), 10_000, 8_000, false), "maximum-flat",
            new LinuxRenderContainerFixture.ProbeBudget(4096, 256, 128 * 1024), true);
    }

    @Test void maximumMulticolorPageIsMeasuredAndNotMisrepresentedAsPaletteOnly() throws Exception {
        measure(SyntheticResourcePng.multicolor(temporary.resolve("multicolor.png"), 10_000, 8_000), "maximum-multicolor",
            new LinuxRenderContainerFixture.ProbeBudget(4096, 256, 128 * 1024), true);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void maximumPagesAreMeasuredAtCandidateBudgetWithoutAdmittingTheWorker(boolean multicolor) throws Exception {
        String label = "maximum-candidate-2g-" + (multicolor ? "multicolor" : "flat");
        var original = multicolor
            ? SyntheticResourcePng.multicolor(temporary.resolve("candidate.png"), 10_000, 8_000)
            : SyntheticResourcePng.write(temporary.resolve("candidate.png"), 10_000, 8_000, false);
        measure(original, label, new LinuxRenderContainerFixture.ProbeBudget(2048, 256, 128 * 1024), true);
    }

    @Test void currentWorkerBudgetIsObservedWithoutAssumingAdmission() throws Exception {
        var state = measure(SyntheticResourcePng.multicolor(temporary.resolve("worker-budget.png"), 10_000, 8_000), "worker-budget",
            new LinuxRenderContainerFixture.ProbeBudget(1024, 256, 128 * 1024), false);
        assertThat(state.oomKilled()).isTrue();
    }

    @Test void memoryAndScratchFaultsDoNotCorruptOriginalOrFollowingPage() throws Exception {
        var maximum = SyntheticResourcePng.write(temporary.resolve("memory.png"), 10_000, 8_000, false);
        var state = measure(maximum, "memory-fault", new LinuxRenderContainerFixture.ProbeBudget(128, 256, 64 * 1024), false);
        assertThat(state.oomKilled()).isTrue();
        var large = SyntheticResourcePng.write(temporary.resolve("scratch.png"), 1200, 800, true);
        state = measure(large, "scratch-fault", new LinuxRenderContainerFixture.ProbeBudget(1024, 256, 16), false);
        assertThat(state.exitCode()).isEqualTo(1); assertThat(state.oomKilled()).isFalse();
        measure(SyntheticResourcePng.multicolor(temporary.resolve("recovery.png"), 320, 220), "recovery",
            new LinuxRenderContainerFixture.ProbeBudget(1024, 256, 64 * 1024), true);
    }

    private LinuxRenderContainerFixture.ProbeState measure(Path original, String label,
            LinuxRenderContainerFixture.ProbeBudget budget, boolean mustSucceed) throws Exception {
        return measure(original, label, budget, mustSucceed, List.of());
    }

    private LinuxRenderContainerFixture.ProbeState measure(Path original, String label,
            LinuxRenderContainerFixture.ProbeBudget budget, boolean mustSucceed, List<OcrManifest.Region> regions) throws Exception {
        var before = LocalFileRenderAdapterTest.metadata(original);
        assertThat(before.byteSize()).isLessThanOrEqualTo(RenderPolicy.MAX_ORIGINAL_BYTES);
        if (label.startsWith("maximum") || label.equals("worker-budget"))
            assertThat((long) before.widthPx() * before.heightPx()).isEqualTo(RenderPolicy.MAX_PIXELS);
        var request = LocalFileRenderAdapterTest.request(before, regions, RenderPolicy.initial());
        var staging = Files.createDirectory(temporary.resolve(label));
        var settings = new RenderChildSettings(Path.of("/codecs/cwebp"), LinuxRenderContainerFixture.ENCODER_SHA256,
            Path.of("/codecs/dwebp"), LinuxRenderContainerFixture.DECODER_SHA256, Duration.ofSeconds(60));
        RenderSubprocessProtocol.writeRequest(staging.resolve("request.bin"), Path.of("/original"), settings, request);
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.nativeResourceProbe(original, staging, budget, Path.of(System.getProperty("renderer.shared.directory")));
        }
        assertThat(LocalFileRenderAdapterTest.metadata(original)).isEqualTo(before);
        if (mustSucceed) { assertThat(state.exitCode()).isZero(); assertThat(state.oomKilled()).isFalse(); }
        if (state.oomKilled()) {
            assertThat(state.exitCode()).isNotZero(); assertThat(staging.resolve("result.bin")).doesNotExist();
            System.out.println("native-resource-measurement " + label + ": kernel OOM; no result");
            return state;
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(metrics.path("codec").textValue()).isEqualTo("native-ffm-experimental");
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(budget.memoryMiB() * 1024L * 1024);
        assertThat(metrics.path("swapLimitBytes").longValue()).isZero();
        assertThat(metrics.path("scratchCapacityBytes").longValue()).isEqualTo(budget.scratchKiB() * 1024L);
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive()
            .isLessThanOrEqualTo(metrics.path("memoryLimitBytes").longValue());
        assertThat(metrics.path("jvmPeakRssKiB").longValue()).isPositive();
        assertThat(metrics.path("elapsedNanos").longValue()).isPositive();
        if (state.exitCode() == 0) {
            assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
            assertThat(metrics.path("pixelRoundTripExact").booleanValue()).isTrue();
            var output = RenderSubprocessProtocol.readResult(staging.resolve("result.bin"), staging, request);
            assertThat(output.manifest().regions()).hasSize(regions.size());
            assertThat(LocalFileRenderAdapterTest.metadata(output.path()).sha256()).isEqualTo(output.manifest().image().sha256());
            assertThat(metrics.path("outputBytes").longValue()).isEqualTo(output.manifest().image().byteSize());
            assertThat(metrics.path("outputSha256").textValue()).isEqualTo(output.manifest().image().sha256());
        } else {
            assertThat(state.exitCode()).isEqualTo(1);
            assertThat(metrics.path("outcome").textValue()).isEqualTo("failed");
            assertThat(metrics.path("pixelRoundTripExact").booleanValue()).isFalse();
            assertThat(staging.resolve("result.bin")).doesNotExist();
        }
        System.out.println("native-resource-measurement " + label + ": " + metrics);
        return state;
    }
}
