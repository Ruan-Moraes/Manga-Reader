package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

class PageRasterPainterTest {
    private static final int WIDTH = 360, HEIGHT = 220;
    private static final UUID JOB = UUID.fromString("12345678-1234-1234-1234-123456789012");
    private static final UUID REGION = new UUID(0, 1);
    private static final BundledRenderingFonts FONTS = new BundledRenderingFonts();
    private final PageRasterPainter painter = new PageRasterPainter(FONTS);

    @ParameterizedTest
    @MethodSource("destinations")
    void fitsAndActuallyDrawsKnownGlyphsInEachDestinationWithoutOutsideChanges(String target, String text) {
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        var request = request(target, text, polygon);
        var result = painter.paint(image, request);
        assertThat(result).containsExactly(new RenderManifest.Placement(REGION, false, result.getFirst().fontSizePx()));
        assertThat(result.getFirst().fontSizePx()).isBetween(12, 48);
        assertThat(changedInside(image, polygon, 0xffeeeeee)).isGreaterThan(20);
        assertOutside(image, polygon, 0xffeeeeee);
        assertThat(request.regions().getFirst().translatedText()).isEqualTo(text);
        assertThatThrownBy(result::clear).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void reducesFontUntilEntireTextFitsAndNeverClaimsBelowMinimum() {
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .4);
        var result = painter.paint(image, request("pt-BR", "Uma tradução com várias palavras para testar quebra de linha e redução.", polygon));
        assertThat(result.getFirst().overflow()).isFalse();
        assertThat(result.getFirst().fontSizePx()).isBetween(12, 47);
        assertOutside(image, polygon, 0xffeeeeee);
    }

    @ParameterizedTest
    @ValueSource(strings = {"😀", "\uD800", "primeira\tsegunda", "texto\u0001oculto", "a"})
    void missingGlyphControlsOrVeryNarrowAreaAreHonestFullFallback(String text) {
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .12, .2);
        var request = request("pt-BR", text, polygon);
        var result = painter.paint(image, request);
        assertThat(result).containsExactly(new RenderManifest.Placement(REGION, true, 0));
        assertThat(request.regions().getFirst().translatedText()).isEqualTo(text);
        assertOutside(image, polygon, 0xffeeeeee);
    }

    @Test
    void largeTranslationFallsBackEntirelyAndItsManifestRetainsEveryCharacter() {
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        String text = " tradução completa ".repeat(300);
        var request = request("pt-BR", text, polygon);
        var result = painter.paint(image, request);
        assertThat(result).containsExactly(new RenderManifest.Placement(REGION, true, 0));
        var manifest = RenderManifest.create(request, new RenderedImage(
            "image/webp", 100, WIDTH, HEIGHT, "d".repeat(64)), result);
        assertThat(manifest.regions().getFirst().translatedText()).isEqualTo(text);
        assertThat(manifest.regions().getFirst().overflow()).isTrue();
    }

    @Test
    void markupLineBreaksAndCjkAreDataRatherThanExecutedOrNormalized() {
        String text = "  <b>café</b>\r\nação\n\nfinal  ";
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var request = request("pt-BR", text, polygon);
        var result = painter.paint(CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee), request);
        assertThat(result.getFirst().overflow()).isFalse();
        assertThat(request.regions().getFirst().translatedText()).isEqualTo(text);
        var cjk = request("zh-Hant", "繁體中文漫畫沒有新增空格", polygon);
        assertThat(painter.paint(CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee), cjk).getFirst().overflow()).isFalse();
        assertThat(cjk.regions().getFirst().translatedText()).isEqualTo("繁體中文漫畫沒有新增空格");
    }

    @Test
    void antialiasOnInclinedRegionNeverEscapesItsPolygon() {
        var polygon = List.of(new OcrManifest.Vertex(.5, .05), new OcrManifest.Vertex(.95, .5),
            new OcrManifest.Vertex(.5, .95), new OcrManifest.Vertex(.05, .5));
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        var result = painter.paint(image, request("pt-BR", "Olá, mangá!", polygon));
        assertThat(result.getFirst().overflow()).isFalse();
        assertThat(changedInside(image, polygon, 0xffeeeeee)).isGreaterThan(20);
        assertOutside(image, polygon, 0xffeeeeee);
    }

    @ParameterizedTest
    @ValueSource(ints = {0xffffffff, 0xff000000})
    void contrastUsesOppositeInkOnLightAndDarkSurroundings(int background) {
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, background);
        painter.paint(image, request("en", "Hello", polygon));
        int ink = background == 0xffffffff ? 0xff000000 : 0xffffffff;
        boolean found = false;
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) found |= image.getRGB(x, y) == ink;
        assertThat(found).isTrue();
        assertOutside(image, polygon, background);
    }

    @Test
    void pageWithoutRegionsRemainsPixelEquivalentWithoutDrawingOrArtificialBox() {
        var image = CleanBoxPainterTest.fixture(13, 17, 0x00123456);
        image.setRGB(6, 8, 0x01020304);
        var original = image.getRGB(0, 0, 13, 17, null, 0, 13);
        assertThat(painter.paint(image, CleanBoxPainterTest.request(13, 17, List.of()))).isEmpty();
        assertThat(image.getRGB(0, 0, 13, 17, null, 0, 13)).containsExactly(original);
    }

    @Test
    void interruptedOrInvalidRasterFailsBeforePaintingAndLeavesNoRawCause() {
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        var request = request("pt-BR", "Olá", CleanBoxPainterTest.rectangle(.1, .1, .9, .9));
        assertThatThrownBy(() -> painter.paint(null, request)).isInstanceOf(RenderPaintingException.class)
            .hasMessage("paint-invalid-input").hasNoCause();
        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> painter.paint(image, request)).isInstanceOf(RenderPaintingException.class)
                .hasMessage("paint-cancelled").hasNoCause();
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally { Thread.interrupted(); }
        assertThat(image.getRGB(180, 100)).isEqualTo(0xffeeeeee);
    }

    static RenderRequest request(String target, String text, List<OcrManifest.Vertex> polygon) {
        var pair = new LanguagePair(target.equals("pt-BR") ? "en" : "pt-BR", target);
        var ocr = new OcrManifest("1.0", JOB, pair.source(), WIDTH, HEIGHT,
            List.of(new OcrManifest.Region(REGION, 0, "source", polygon)));
        var input = new TranslationRequest(JOB, pair, List.of(new TranslationRequest.Region(REGION, 0, "source")));
        var translation = new TranslationValidator(Set.of(pair)).validateResponse(input,
            new TranslationResponse(List.of(new TranslationResponse.Region(REGION, text))));
        return RenderRequest.create(new RenderSource("image/png", 100, WIDTH, HEIGHT, "a".repeat(64)),
            ocr, translation, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
    }

    @Test
    void laterRegionNeutralizationErasesEarlierTextInOverlapWithoutReestimatingColors() {
        var first = CleanBoxPainterTest.rectangle(.2, .2, .8, .8);
        var second = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var pair = new LanguagePair("en", "pt-BR");
        var regions = List.of(new OcrManifest.Region(REGION, 0, "source1", first),
            new OcrManifest.Region(new UUID(0, 2), 1, "source2", second));
        var ocr = new OcrManifest("1.0", JOB, "en", WIDTH, HEIGHT, regions);
        var input = new TranslationRequest(JOB, pair, regions.stream().map(region ->
            new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
        var texts = List.of("Olá", "texto muito longo ".repeat(300));
        var translated = new TranslationValidator(Set.of(pair)).validateResponse(input, new TranslationResponse(
            List.of(new TranslationResponse.Region(REGION, texts.getFirst()), new TranslationResponse.Region(new UUID(0, 2), texts.get(1)))));
        var request = RenderRequest.create(new RenderSource("image/png", 100, WIDTH, HEIGHT, "a".repeat(64)),
            ocr, translated, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        var placements = painter.paint(image, request);
        assertThat(placements).extracting(RenderManifest.Placement::overflow).containsExactly(false, true);
        assertThat(changedInside(image, second, 0xffeeeeee)).isEqualTo(3);
        assertOutside(image, second, 0xffeeeeee);
    }

    private static Stream<Arguments> destinations() {
        return Stream.of(Arguments.of("ja", "日本語の漫画。こんにちは！"), Arguments.of("en", "Hello, reader!"),
            Arguments.of("es", "¡Hola! ¿Cómo estás?"), Arguments.of("ko", "한국어 만화 안녕하세요!"),
            Arguments.of("zh-Hans", "简体中文漫画阅读顺序。"), Arguments.of("zh-Hant", "繁體中文漫畫閱讀順序。"),
            Arguments.of("pt-BR", "Olá! Ação e coração."));
    }

    private static Path2D shape(List<OcrManifest.Vertex> polygon) {
        var path = new Path2D.Double();
        path.moveTo(polygon.getFirst().x() * WIDTH, polygon.getFirst().y() * HEIGHT);
        for (int i = 1; i < 4; i++) path.lineTo(polygon.get(i).x() * WIDTH, polygon.get(i).y() * HEIGHT);
        path.closePath();
        return path;
    }
    private static int changedInside(BufferedImage image, List<OcrManifest.Vertex> polygon, int original) {
        var path = shape(polygon);
        int count = 0;
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++)
            if (path.contains(x + .5, y + .5) && image.getRGB(x, y) != original) count++;
        return count;
    }
    private static void assertOutside(BufferedImage image, List<OcrManifest.Vertex> polygon, int original) {
        var path = shape(polygon);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++)
            if (!path.contains(x + .5, y + .5)) assertThat(image.getRGB(x, y)).isEqualTo(original);
    }
}
