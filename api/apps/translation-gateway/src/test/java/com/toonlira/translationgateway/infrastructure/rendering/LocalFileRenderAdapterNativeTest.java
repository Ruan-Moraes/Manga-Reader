package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@EnabledIfSystemProperty(named = "renderer.native.enabled", matches = "true")
class LocalFileRenderAdapterNativeTest {
    @TempDir Path temporary;

    @ParameterizedTest
    @ValueSource(strings = {"png", "jpeg", "webp"})
    void realFileRoundTripPaintsOnlyInsidePolygonAndReturnsVerifiedManifest(String format) throws Exception {
        var codec = codec();
        var original = original(format, codec);
        var source = LocalFileRenderAdapterTest.metadata(original);
        var baseline = baseline(original, source, codec);
        var originalBytes = Files.readAllBytes(original);
        var polygon = List.of(new OcrManifest.Vertex(.5, .05), new OcrManifest.Vertex(.95, .5),
            new OcrManifest.Vertex(.5, .95), new OcrManifest.Vertex(.05, .5));
        var request = LocalFileRenderAdapterTest.request(source,
            List.of(new OcrManifest.Region(new UUID(0, 1), 0, "source", polygon)), RenderPolicy.initial());
        var output = adapter(codec).render(original, request);
        assertThat(output.manifest().regions().getFirst().overflow()).isFalse();
        assertThat(output.manifest().regions().getFirst().translatedText()).isEqualTo("Olá, mangá!");
        assertThat(output.manifest().image().sha256()).isEqualTo(WebpProcessCodecTest.digest(output.path()));
        assertThat(output.manifest().image().byteSize()).isEqualTo(Files.size(output.path()));
        var decoded = codec.decode(output.path(), output.manifest().image(), request.policy());
        var shape = new Path2D.Double();
        shape.moveTo(polygon.getFirst().x() * source.widthPx(), polygon.getFirst().y() * source.heightPx());
        for (int i = 1; i < 4; i++) shape.lineTo(polygon.get(i).x() * source.widthPx(), polygon.get(i).y() * source.heightPx());
        shape.closePath();
        int changes = 0;
        for (int y = 0; y < source.heightPx(); y++) for (int x = 0; x < source.widthPx(); x++) {
            if (!shape.contains(x + .5, y + .5)) assertThat(decoded.getRGB(x, y)).isEqualTo(baseline.getRGB(x, y));
            else if (decoded.getRGB(x, y) != baseline.getRGB(x, y)) changes++;
        }
        assertThat(changes).isGreaterThan(20);
        assertThat(Files.readAllBytes(original)).containsExactly(originalBytes);
        assertManifest(output.manifest(), request);
        try (var files = Files.list(temporary.toRealPath())) {
            assertThat(files.toList()).containsExactlyInAnyOrder(original.toRealPath(), output.path());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"png", "jpeg", "webp"})
    void emptyPageIsEquivalentToDecodedOriginalAndHasNoInventedRegion(String format) throws Exception {
        var codec = codec();
        var original = original(format, codec);
        var source = LocalFileRenderAdapterTest.metadata(original);
        var baseline = baseline(original, source, codec);
        var request = LocalFileRenderAdapterTest.request(source, List.of(), RenderPolicy.initial());
        var output = adapter(codec).render(original, request);
        assertThat(output.manifest().regions()).isEmpty();
        assertThat(codec.decode(output.path(), output.manifest().image(), request.policy())
            .getRGB(0, 0, 320, 220, null, 0, 320)).containsExactly(baseline.getRGB(0, 0, 320, 220, null, 0, 320));
        assertManifest(output.manifest(), request);
    }

    @Test
    void fullOverflowSurvivesFileManifestSerializationWithoutPartialText() throws Exception {
        var codec = codec();
        var original = original("png", codec);
        var source = LocalFileRenderAdapterTest.metadata(original);
        var request = LocalFileRenderAdapterTest.request(source,
            List.of(new OcrManifest.Region(new UUID(0, 1), 0, "source", CleanBoxPainterTest.rectangle(.1, .1, .11, .2))),
            RenderPolicy.initial());
        var output = adapter(codec).render(original, request);
        assertThat(output.manifest().regions().getFirst().overflow()).isTrue();
        assertThat(output.manifest().regions().getFirst().translatedText()).isEqualTo("Olá, mangá!");
        assertManifest(output.manifest(), request);
    }

    @Test
    void nativeOutputLimitPreservesOriginalAndRemovesEveryOwnedPartial() throws Exception {
        var codec = codec();
        var original = original("png", codec);
        var source = LocalFileRenderAdapterTest.metadata(original);
        var before = Files.readAllBytes(original);
        var policy = new RenderPolicy("small-1.0", 12 * 1024 * 1024, 12000, 12000, 80000000, 1, 4096, 12, 48, 2);
        var request = LocalFileRenderAdapterTest.request(source, List.of(), policy);
        assertThatThrownBy(() -> adapter(codec).render(original, request)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-unavailable").hasNoCause();
        assertThat(Files.readAllBytes(original)).containsExactly(before);
        try (var files = Files.list(temporary)) { assertThat(files.toList()).containsExactly(original); }
    }

    private LocalFileRenderAdapter adapter(WebpProcessCodec codec) {
        return new LocalFileRenderAdapter(codec, new PageRasterPainter(Fonts.VALUE), temporary);
    }
    private static final class Fonts { private static final BundledRenderingFonts VALUE = new BundledRenderingFonts(); }
    private static WebpProcessCodec codec() {
        return new WebpProcessCodec(Path.of(System.getProperty("renderer.cwebp.path")), System.getProperty("renderer.cwebp.sha256"),
            Path.of(System.getProperty("renderer.dwebp.path")), System.getProperty("renderer.dwebp.sha256"), Duration.ofSeconds(10));
    }
    private Path original(String format, WebpProcessCodec codec) throws Exception {
        var image = CleanBoxPainterTest.fixture(320, 220, format.equals("jpeg") ? 0xffeeeeee : 0x7fa4c1e3);
        image.setRGB(0, 0, format.equals("jpeg") ? 0xff123456 : 0x00123456);
        var path = temporary.resolve("original." + format);
        if (format.equals("webp")) Files.move(codec.encode(image, temporary, RenderPolicy.initial()).path(), path);
        else {
            if (format.equals("jpeg")) {
                var rgb = new BufferedImage(320, 220, BufferedImage.TYPE_INT_RGB);
                rgb.setRGB(0, 0, 320, 220, image.getRGB(0, 0, 320, 220, null, 0, 320), 0, 320);
                image = rgb;
            }
            assertThat(ImageIO.write(image, format, path.toFile())).isTrue();
        }
        return path;
    }
    private static BufferedImage baseline(Path original, RenderSource source, WebpProcessCodec codec) throws Exception {
        if (!source.mimeType().equals("image/webp")) return ImageIO.read(original.toFile());
        return codec.decode(original, new RenderedImage(source.mimeType(),
            source.byteSize(), source.widthPx(), source.heightPx(), source.sha256()), RenderPolicy.initial());
    }
    private static void assertManifest(RenderManifest manifest, RenderRequest request) {
        var service = new RenderManifestService(GatewayJsonMapper.create());
        var encoded = service.encode(manifest, request.policy());
        var decoded = service.decode(encoded.bytes(), encoded.sha256(), request, manifest.image());
        assertThat(decoded.regions()).containsExactlyElementsOf(manifest.regions());
        assertThat(decoded.originalSha256()).isEqualTo(request.source().sha256());
    }
}
