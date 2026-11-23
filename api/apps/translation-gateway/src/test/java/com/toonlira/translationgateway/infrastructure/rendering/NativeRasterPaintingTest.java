package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.Point;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.awt.image.DataBufferInt;
import java.awt.image.DirectColorModel;
import java.awt.image.Raster;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class NativeRasterPaintingTest {
    private static final int WIDTH = 360, HEIGHT = 220, BACKGROUND = 0x7feeeeee;
    private final PageRasterPainter painter = new PageRasterPainter(new BundledRenderingFonts());

    @ParameterizedTest
    @MethodSource("destinations")
    void eachDestinationAndAllPixelsMatchTheExistingPainter(String target, String text) {
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var request = PageRasterPainterTest.request(target, text, polygon);
        var expected = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, BACKGROUND);
        var expectedPlacements = painter.paint(expected, request);
        try (var surface = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            var image = surface.image();
            for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) image.setRGB(x, y, BACKGROUND);
            var buffer = image.getRaster().getDataBuffer();
            assertThat(painter.paint(image, request)).containsExactlyElementsOf(expectedPlacements);
            assertThat(image.getRaster().getDataBuffer()).isSameAs(buffer);
            for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
                assertThat(image.getRGB(x, y)).isEqualTo(expected.getRGB(x, y));
            }
        }
    }

    @Test
    void emptyPageLeavesAllTransparentValuesUntouched() {
        try (var surface = new NativeArgbRaster(13, 17, RenderPolicy.initial())) {
            surface.image().setRGB(6, 8, 0x00123456);
            assertThat(painter.paint(surface.image(), CleanBoxPainterTest.request(13, 17, List.of()))).isEmpty();
            for (int y = 0; y < 17; y++) for (int x = 0; x < 13; x++) {
                assertThat(surface.image().getRGB(x, y)).isEqualTo(x == 6 && y == 8 ? 0x00123456 : 0);
            }
        }
    }

    @Test
    void anArbitraryCustomOrPremultipliedRasterRemainsRejected() {
        var request = PageRasterPainterTest.request("pt-BR", "Olá", CleanBoxPainterTest.rectangle(.1, .1, .9, .9));
        int[] masks = {0x00ff0000, 0x0000ff00, 0x000000ff, 0xff000000};
        var data = new DataBufferInt(WIDTH * HEIGHT);
        var raster = Raster.createPackedRaster(data, WIDTH, HEIGHT, WIDTH, masks, new Point(0, 0));
        var premultiplied = new BufferedImage(ColorModel.getRGBdefault(), raster, true, null);
        assertThat(premultiplied.isAlphaPremultiplied()).isTrue();
        // This JDK constructor can retain TYPE_INT_ARGB while coercing its ColorModel to premultiplied.
        assertThat(premultiplied.getType()).isEqualTo(BufferedImage.TYPE_INT_ARGB);
        int[] swappedMasks = {0x000000ff, 0x0000ff00, 0x00ff0000, 0xff000000};
        var swapped = Raster.createPackedRaster(new DataBufferInt(WIDTH * HEIGHT), WIDTH, HEIGHT, WIDTH,
            swappedMasks, new Point(0, 0));
        var custom = new BufferedImage(new DirectColorModel(32, swappedMasks[0], swappedMasks[1], swappedMasks[2],
            swappedMasks[3]), swapped, false, null);
        assertThat(custom.getType()).isEqualTo(BufferedImage.TYPE_CUSTOM);
        for (var invalid : List.of(premultiplied, custom)) {
            assertThatThrownBy(() -> painter.paint(invalid, request)).isInstanceOf(RenderPaintingException.class)
                .hasMessage("paint-invalid-input").hasNoCause();
        }
    }

    @Test
    void aClosedNativeViewCannotApproveAnEmptyPageWithoutTouchingPixels() {
        var surface = new NativeArgbRaster(13, 17, RenderPolicy.initial());
        var image = surface.image();
        surface.close();
        assertThatThrownBy(() -> painter.paint(image, CleanBoxPainterTest.request(13, 17, List.of())))
            .isInstanceOf(RenderPaintingException.class).hasMessage("paint-invalid-input").hasNoCause();
    }

    @Test
    void fullOverflowKeepsIdenticalPlacementsPixelsAndTranslation() {
        String text = " tradução completa ".repeat(300);
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var request = PageRasterPainterTest.request("pt-BR", text, polygon);
        var expected = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, BACKGROUND);
        var placements = painter.paint(expected, request);
        assertThat(placements.getFirst().overflow()).isTrue();
        try (var surface = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) surface.image().setRGB(x, y, BACKGROUND);
            assertThat(painter.paint(surface.image(), request)).containsExactlyElementsOf(placements);
            assertThat(request.regions().getFirst().translatedText()).isEqualTo(text);
            for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
                assertThat(surface.image().getRGB(x, y)).isEqualTo(expected.getRGB(x, y));
            }
        }
    }

    private static Stream<Arguments> destinations() {
        return Stream.of(Arguments.of("ja", "日本語の漫画。こんにちは！"), Arguments.of("en", "Hello, reader!"),
            Arguments.of("es", "¡Hola! ¿Cómo estás?"), Arguments.of("ko", "한국어 만화 안녕하세요!"),
            Arguments.of("zh-Hans", "简体中文漫画阅读顺序。"), Arguments.of("zh-Hant", "繁體中文漫畫閱讀順序。"),
            Arguments.of("pt-BR", "Olá! Ação e coração."));
    }
}
