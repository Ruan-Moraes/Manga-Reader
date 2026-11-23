package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;

/** Explicit native opt-in; never downloads, installs or discovers executables on PATH. */
@EnabledIfSystemProperty(named = "renderer.native.enabled", matches = "true")
class WebpProcessCodecNativeTest {
    @TempDir Path temporary;

    @Test
    void realLosslessRoundTripPreservesEveryPixelIncludingInvisibleRgb() throws Exception {
        var image = new BufferedImage(7, 5, BufferedImage.TYPE_INT_ARGB);
        var pixels = new int[35];
        for (int i = 0; i < pixels.length; i++) pixels[i] = ((i * 19 & 255) << 24) | (i * 923_527 & 0xffffff);
        pixels[0] = 0x00123456;
        pixels[1] = 0x00fedcba;
        image.setRGB(0, 0, 7, 5, pixels, 0, 7);
        var codec = codec();
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        var decoded = codec.decode(artifact.path(), artifact.image(), RenderPolicy.initial());
        assertThat(decoded.getRGB(0, 0, 7, 5, null, 0, 7)).containsExactly(pixels);
        assertThat(image.getRGB(0, 0, 7, 5, null, 0, 7)).containsExactly(pixels);
        assertThat(artifact.image().mimeType()).isEqualTo("image/webp");
        assertThat(artifact.image().sha256()).isEqualTo(WebpProcessCodecTest.digest(artifact.path()));
        assertThat(artifact.image().byteSize()).isEqualTo(Files.size(artifact.path()));
        assertThat(artifact.toString()).doesNotContain(artifact.path().toString(), artifact.image().sha256());
        try (var paths = Files.list(temporary)) { assertThat(paths.toList()).containsExactly(artifact.path()); }
    }

    @Test
    void opaqueAndOnePixelImagesAlsoRoundTripExactly() throws Exception {
        var codec = codec();
        var image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, 0xff010203);
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        assertThat(codec.decode(artifact.path(), artifact.image(), RenderPolicy.initial()).getRGB(0, 0))
            .isEqualTo(0xff010203);
    }

    @Test
    void minimalTransparentOnePixelWebpIsNotRejectedByHeaderInspection() throws Exception {
        var codec = codec();
        var image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB);
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        assertThat(codec.decode(artifact.path(), artifact.image(), RenderPolicy.initial()).getRGB(0, 0)).isZero();
    }

    @Test
    void tamperedHashAndDimensionsFailBeforeDecodeWithoutDeletingCallerFile() throws Exception {
        var codec = codec();
        var image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_ARGB);
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        var metadata = artifact.image();
        var invalid = new RenderedImage("image/webp", metadata.byteSize(), 2, 2, "0".repeat(64));
        assertThatThrownBy(() -> codec.decode(artifact.path(), invalid, RenderPolicy.initial()))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-invalid-media");
        var wrongDimensions = new RenderedImage("image/webp", metadata.byteSize(), 3, 2, metadata.sha256());
        assertThatThrownBy(() -> codec.decode(artifact.path(), wrongDimensions, RenderPolicy.initial()))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-invalid-media");
        assertThat(Files.exists(artifact.path())).isTrue();
        assertThat(WebpProcessCodecTest.digest(artifact.path())).isEqualTo(metadata.sha256());
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 127, 255})
    void uniformAlphaRoundTripPreservesAllChannels(int alpha) throws Exception {
        var image = new BufferedImage(20, 13, BufferedImage.TYPE_INT_ARGB);
        var pixels = new int[260];
        for (int i = 0; i < pixels.length; i++) pixels[i] = (alpha << 24) | (i * 711_713 & 0xffffff);
        image.setRGB(0, 0, 20, 13, pixels, 0, 20);
        var codec = codec();
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        assertThat(codec.decode(artifact.path(), artifact.image(), RenderPolicy.initial())
            .getRGB(0, 0, 20, 13, null, 0, 20)).containsExactly(pixels);
    }

    @Test
    void realOutputLimitRejectsWholeFileWithoutLeavingPartialOrChangingRaster() throws Exception {
        var codec = codec();
        var image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_ARGB);
        image.setRGB(0, 0, 0x00123456);
        var strict = new RenderPolicy("fixture", 100, 2, 2, 4, 1, 100, 12, 48, 2);
        assertThatThrownBy(() -> codec.encode(image, temporary, strict))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-output-limit");
        assertThat(image.getRGB(0, 0)).isEqualTo(0x00123456);
        try (var paths = Files.list(temporary)) { assertThat(paths.toList()).isEmpty(); }
    }

    @Test
    void acceptsExactEncodedByteBoundaryAndRejectsOneByteLess() throws Exception {
        var codec = codec();
        var image = new BufferedImage(3, 3, BufferedImage.TYPE_INT_ARGB);
        image.setRGB(0, 0, 0x00123456);
        var first = codec.encode(image, temporary, RenderPolicy.initial());
        long bytes = first.image().byteSize();
        var exact = new RenderPolicy("fixture", 100, 3, 3, 9, bytes, 100, 12, 48, 2);
        var accepted = codec.encode(image, temporary, exact);
        assertThat(accepted.image().byteSize()).isEqualTo(bytes);
        assertThat(accepted.image().sha256()).isEqualTo(first.image().sha256());
        var smaller = new RenderPolicy("fixture", 100, 3, 3, 9, bytes - 1, 100, 12, 48, 2);
        assertThatThrownBy(() -> codec.encode(image, temporary, smaller))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-output-limit");
        try (var paths = Files.list(temporary)) {
            assertThat(paths.toList()).containsExactlyInAnyOrder(first.path(), accepted.path());
        }
    }

    @Test
    void cleanPolygonRemainsPixelBoundedAfterNativeWebpEncodeAndDecode() throws Exception {
        var image = CleanBoxPainterTest.fixture(37, 29, 0x7fa4c1e3);
        var polygon = List.of(new OcrManifest.Vertex(.501, .101), new OcrManifest.Vertex(.901, .501),
            new OcrManifest.Vertex(.501, .901), new OcrManifest.Vertex(.101, .501));
        var shape = new Path2D.Double();
        shape.moveTo(polygon.getFirst().x() * 37, polygon.getFirst().y() * 29);
        for (int i = 1; i < 4; i++) shape.lineTo(polygon.get(i).x() * 37, polygon.get(i).y() * 29);
        shape.closePath();
        for (int y = 0; y < 29; y++) for (int x = 0; x < 37; x++)
            if (shape.contains(x + .5, y + .5)) image.setRGB(x, y, 0xff010203);
        int[] originalPixels = image.getRGB(0, 0, 37, 29, null, 0, 37);
        Path originalFile = temporary.resolve("original.png");
        assertThat(ImageIO.write(image, "png", originalFile.toFile())).isTrue();
        String originalHash = WebpProcessCodecTest.digest(originalFile);
        new CleanBoxPainter().clean(image, CleanBoxPainterTest.request(37, 29, List.of(polygon)));
        var codec = codec();
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        var decoded = codec.decode(artifact.path(), artifact.image(), RenderPolicy.initial());
        int changed = 0;
        for (int y = 0; y < 29; y++) for (int x = 0; x < 37; x++) {
            assertThat(decoded.getRGB(x, y)).isEqualTo(image.getRGB(x, y));
            if (!shape.contains(x + .5, y + .5)) assertThat(decoded.getRGB(x, y)).isEqualTo(originalPixels[y * 37 + x]);
            else if (decoded.getRGB(x, y) != originalPixels[y * 37 + x]) changed++;
        }
        assertThat(changed).isPositive();
        assertThat(WebpProcessCodecTest.digest(originalFile)).isEqualTo(originalHash);
        try (var paths = Files.list(temporary)) { assertThat(paths.toList()).containsExactlyInAnyOrder(originalFile, artifact.path()); }
    }

    @Test
    void noTextPageRemainsExactlyEquivalentAfterNativeWebpRoundTrip() throws Exception {
        var image = CleanBoxPainterTest.fixture(13, 17, 0x00123456);
        image.setRGB(6, 8, 0x01020304);
        var original = image.getRGB(0, 0, 13, 17, null, 0, 13);
        assertThat(new CleanBoxPainter().clean(image, CleanBoxPainterTest.request(13, 17, List.of()))).isEmpty();
        var codec = codec();
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        var decoded = codec.decode(artifact.path(), artifact.image(), RenderPolicy.initial());
        assertThat(decoded.getRGB(0, 0, 13, 17, null, 0, 13)).containsExactly(original);
    }

    private static WebpProcessCodec codec() {
        return new WebpProcessCodec(Path.of(System.getProperty("renderer.cwebp.path")),
            System.getProperty("renderer.cwebp.sha256"), Path.of(System.getProperty("renderer.dwebp.path")),
            System.getProperty("renderer.dwebp.sha256"), Duration.ofSeconds(10));
    }

    @ParameterizedTest
    @MethodSource("textDestinations")
    void realTextAndOutsidePixelsSurviveNativeWebpRoundTrip(String target, String text) throws Exception {
        var image = CleanBoxPainterTest.fixture(360, 220, 0xffeeeeee);
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var request = PageRasterPainterTest.request(target, text, polygon);
        var placements = new PageRasterPainter(FontHolder.FONTS).paint(image, request);
        assertThat(placements.getFirst().overflow()).isFalse();
        var codec = codec();
        var artifact = codec.encode(image, temporary, RenderPolicy.initial());
        var decoded = codec.decode(artifact.path(), artifact.image(), RenderPolicy.initial());
        assertThat(decoded.getRGB(0, 0, 360, 220, null, 0, 360))
            .containsExactly(image.getRGB(0, 0, 360, 220, null, 0, 360));
        int textPixels = 0;
        for (int y = 0; y < 220; y++) for (int x = 0; x < 360; x++) {
            if (x < 36 || x >= 324 || y < 22 || y >= 198) assertThat(decoded.getRGB(x, y)).isEqualTo(0xffeeeeee);
            else if (decoded.getRGB(x, y) != 0xffeeeeee) textPixels++;
        }
        assertThat(textPixels).isGreaterThan(20);
        var manifest = RenderManifest.create(request, artifact.image(), placements);
        assertThat(manifest.regions().getFirst().translatedText()).isEqualTo(text);
    }

    private static Stream<Arguments> textDestinations() {
        return Stream.of(Arguments.of("ja", "日本語の漫画。こんにちは！"), Arguments.of("en", "Hello, reader!"),
            Arguments.of("es", "¡Hola! ¿Cómo estás?"), Arguments.of("ko", "한국어 만화 안녕하세요!"),
            Arguments.of("zh-Hans", "简体中文漫画阅读顺序。"), Arguments.of("zh-Hant", "繁體中文漫畫閱讀順序。"),
            Arguments.of("pt-BR", "Olá! Ação e coração."));
    }
    private static final class FontHolder { private static final BundledRenderingFonts FONTS = new BundledRenderingFonts(); }
}
