package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.image.BufferedImage;
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

/** Opt-in packaged Linux adapter, not admission of the Spring worker or production resources. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.shared.resources.enabled", matches = "true")
class IsolatedNativeRenderLinuxTest {
    @TempDir Path temporary;
    @BeforeAll static void currentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @ParameterizedTest @ValueSource(strings = {"png", "jpeg", "webp"})
    void supportedOriginalsRemainExactAfterRealPaintingAndSupervisedBootChild(String format) throws Exception {
        var image = CleanBoxPainterTest.fixture(320, 220, 0xffcccccc);
        if (!format.equals("jpeg")) {
            for (int x = 0; x < 320; x++) image.setRGB(x, 0, (x % 3 == 0 ? 0 : x & 255) << 24 | 0x123456);
        }
        var png = temporary.resolve("original.png");
        assertThat(ImageIO.write(image, "png", png.toFile())).isTrue(); image.flush();
        Path original = png;
        if (format.equals("jpeg")) {
            original = temporary.resolve("original.jpg");
            var rgb = new BufferedImage(320, 220, BufferedImage.TYPE_INT_RGB);
            try {
                for (int y = 0; y < 220; y++) for (int x = 0; x < 320; x++) rgb.setRGB(x, y, 0xffcccccc);
                assertThat(ImageIO.write(rgb, "jpeg", original.toFile())).isTrue();
            } finally { rgb.flush(); }
        } else if (format.equals("webp")) {
            var encoding = Files.createDirectory(temporary.resolve("prepare"));
            try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.encode(png, encoding, "original.webp"); }
            original = encoding.resolve("original.webp");
        }
        var regions = List.of(new OcrManifest.Region(new UUID(0, 1), 0, "synthetic",
            CleanBoxPainterTest.rectangle(.1, .1, .9, .9)));
        var staging = measure(original, "painted", settings("a-valid-pin"), budget(2048, 128 * 1024), true, regions);
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            fixture.decode(staging.resolve("render-probe.webp"), staging);
        }
        BufferedImage expected;
        if (format.equals("webp")) {
            var decoded = Files.createDirectory(temporary.resolve("expected"));
            try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.decode(original, decoded); }
            expected = decodeArgb(decoded.resolve("decoded.png"));
        } else expected = decodeArgb(original);
        var actual = ImageIO.read(staging.resolve("decoded.png").toFile());
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), regions, RenderPolicy.initial());
        try {
            new PageRasterPainter(new BundledRenderingFonts()).paint(expected, request);
            for (int y = 0; y < 220; y++) for (int x = 0; x < 320; x++) assertThat(actual.getRGB(x, y)).isEqualTo(expected.getRGB(x, y));
        } finally { expected.flush(); actual.flush(); }
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void maximumPageIncludesSupervisorAndChildInOneMeasuredTwoGiBBudget(boolean multicolor) throws Exception {
        var original = multicolor ? SyntheticResourcePng.multicolor(temporary.resolve("maximum.png"), 10_000, 8_000)
            : SyntheticResourcePng.write(temporary.resolve("maximum.png"), 10_000, 8_000, false);
        var regions = List.of(new OcrManifest.Region(new UUID(0, 1), 0, "synthetic",
            CleanBoxPainterTest.rectangle(.1, .1, .15, .15)));
        measure(original, "maximum-" + multicolor, settings("a-valid-pin"), budget(2048, 128 * 1024), true, regions);
    }

    @Test void badLibraryPinAndScratchFailureDoNotCorruptTheOriginalOrFollowingPage() throws Exception {
        var original = SyntheticResourcePng.multicolor(temporary.resolve("small.png"), 320, 220);
        measure(original, "bad-pin", settings("invalid"), budget(2048, 128 * 1024), false, List.of());
        measure(original, "scratch", settings("a-valid-pin"), budget(2048, 4), false, List.of());
        measure(original, "following", settings("a-valid-pin"), budget(2048, 128 * 1024), true, List.of());
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void guardedMaximumPageRetainsExactPolicyAndCompletesWithinExperimentalTwoGiBBudget(boolean multicolor) throws Exception {
        var original = multicolor ? SyntheticResourcePng.multicolor(temporary.resolve("guarded-maximum.png"), 10_000, 8_000)
            : SyntheticResourcePng.write(temporary.resolve("guarded-maximum.png"), 10_000, 8_000, false);
        var regions = List.of(new OcrManifest.Region(new UUID(0, 1), 0, "synthetic",
            CleanBoxPainterTest.rectangle(.1, .1, .15, .15)));
        var bounded = new BoundedNativeRenderChildSettings(settings("a-valid-pin"), NativeProcessLimits.initial());
        var directory = measure(original, "guarded-maximum-" + multicolor, bounded, budget(2048, 128 * 1024), true, regions);
        assertThat(GatewayJsonMapper.create().readTree(Files.readAllBytes(directory.resolve("resource-metrics.json")))
            .path("guarded").booleanValue()).isTrue();
    }

    @Test void stricterInheritedBudgetFailsChildAndFollowingBoundedPageStillSucceeds() throws Exception {
        var original = SyntheticResourcePng.multicolor(temporary.resolve("bounded-small.png"), 320, 220);
        var tooSmall = new BoundedNativeRenderChildSettings(settings("a-valid-pin"),
            new NativeProcessLimits(64L * 1024 * 1024, 120, 64L * 1024 * 1024, 128));
        measure(original, "bounded-memory-denied", tooSmall, budget(2048, 128 * 1024), false, List.of());
        measure(original, "bounded-following", new BoundedNativeRenderChildSettings(settings("a-valid-pin"),
            NativeProcessLimits.initial()), budget(2048, 128 * 1024), true, List.of());
    }

    private Path measure(Path original, String label, RenderProcessSettings settings,
            LinuxRenderContainerFixture.ProbeBudget budget, boolean success, List<OcrManifest.Region> regions) throws Exception {
        var before = LocalFileRenderAdapterTest.metadata(original);
        var request = LocalFileRenderAdapterTest.request(before, regions, RenderPolicy.initial());
        var staging = Files.createDirectory(temporary.resolve(label));
        RenderSubprocessProtocol.writeRequest(staging.resolve("request.bin"), Path.of("/original"), settings, request);
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.isolatedNativeResourceProbe(original, staging, budget, Path.of(System.getProperty("renderer.shared.directory")));
        }
        assertThat(LocalFileRenderAdapterTest.metadata(original)).isEqualTo(before);
        assertThat(state.oomKilled()).isFalse();
        assertThat(state.exitCode()).isEqualTo(success ? 0 : 1);
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(metrics.path("codec").textValue()).isEqualTo("isolated-native-ffm-experimental");
        assertThat(metrics.path("memoryLimitBytes").longValue()).isEqualTo(budget.memoryMiB() * 1024L * 1024);
        assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive().isLessThanOrEqualTo(budget.memoryMiB() * 1024L * 1024);
        if (success) {
            var result = RenderSubprocessProtocol.readResult(staging.resolve("result.bin"), staging, request);
            assertThat(LocalFileRenderAdapterTest.metadata(result.path()).sha256()).isEqualTo(result.manifest().image().sha256());
            assertThat(metrics.path("outputSha256").textValue()).isEqualTo(result.manifest().image().sha256());
            assertThat(metrics.path("outputBytes").longValue()).isEqualTo(result.manifest().image().byteSize());
            assertThat(result.manifest().regions()).hasSize(regions.size());
            assertThat(metrics.path("outcome").textValue()).isEqualTo("succeeded");
        } else {
            assertThat(staging.resolve("result.bin")).doesNotExist();
            assertThat(metrics.path("outcome").textValue()).isEqualTo("failed");
        }
        System.out.println("isolated-native-resource " + label + ": " + metrics);
        return staging;
    }
    private static LinuxRenderContainerFixture.ProbeBudget budget(int memoryMiB, int scratchKiB) {
        return new LinuxRenderContainerFixture.ProbeBudget(memoryMiB, 128, scratchKiB);
    }
    private static BufferedImage decodeArgb(Path file) throws Exception {
        var inspector = new MediaInspectionService();
        MediaInspectionService.InspectedMedia media;
        try (var stream = Files.newInputStream(file)) { media = inspector.inspect(stream, RenderPolicy.MAX_ORIGINAL_BYTES); }
        try { return new ValidatedRasterDecoder(null).decode(media, RenderPolicy.initial()); }
        finally { Files.delete(media.path()); }
    }
    private static NativeRenderChildSettings settings(String pin) {
        return new NativeRenderChildSettings(Path.of("/build/install/lib/libwebp.so.7.2.0"),
            pin.equals("invalid") ? "0".repeat(64) : "ae9bd6f135c9ccd5de96cacc19b155f5c646bf3362c6d39086f4b1e1df427eb8",
            Path.of("/build/install/lib/libsharpyuv.so.0.1.2"),
            "f7ef39823cce822098b53a516262b07490a42f69522de1ff5aa9db73232fa457", Duration.ofSeconds(60));
    }
}
