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
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .105, .2);
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
    void overflowingLaterRegionIsPreservedAndDoesNotEraseEarlierTextInOverlap() {
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
        assertThat(changedInside(image, first, 0xffeeeeee)).isGreaterThan(20);
        assertThat(changedInside(image, second, 0xffeeeeee)).isEqualTo(changedInside(image, first, 0xffeeeeee));
        assertOutside(image, second, 0xffeeeeee);
    }

    @Test
    void strokesSpillingOutsideThePolygonAreErasedButUnrelatedArtIsKept() {
        var polygon = CleanBoxPainterTest.rectangle(.3, .3, .7, .7);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        int left = (int) (.3 * WIDTH), mid = (int) (.5 * HEIGHT);
        for (int x = left - 3; x < left + 20; x++) image.setRGB(x, mid, 0xff000000); // stroke crossing the box edge
        for (int y = 5; y < 40; y++) image.setRGB(20, y, 0xff000000); // far-away art
        painter.paint(image, request("pt-BR", "Oi", polygon));
        assertThat(image.getRGB(left - 3, mid)).isEqualTo(0xffffffff);
        assertThat(image.getRGB(20, 20)).isEqualTo(0xff000000);
    }

    @Test
    void overflowKeepsOriginalPixelsInsteadOfErasingTheRegion() {
        var polygon = CleanBoxPainterTest.rectangle(.1, .1, .9, .9);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        image.setRGB(180, 100, 0xff102030);
        var result = painter.paint(image, request("pt-BR", " tradução completa ".repeat(300), polygon));
        assertThat(result.getFirst().overflow()).isTrue();
        assertThat(image.getRGB(180, 100)).isEqualTo(0xff102030);
        assertThat(changedInside(image, polygon, 0xffeeeeee)).isEqualTo(1);
    }

    @Test
    void oversizedRegionIsCappedRelativeToTheMedianOfItsNeighbours() {
        var pair = new LanguagePair("en", "pt-BR");
        var boxes = List.of(CleanBoxPainterTest.rectangle(.02, .02, .3, .3), CleanBoxPainterTest.rectangle(.35, .02, .63, .3),
            CleanBoxPainterTest.rectangle(.68, .02, .96, .3), CleanBoxPainterTest.rectangle(.02, .4, .98, .98));
        var texts = List.of("Uma frase de tamanho médio aqui", "Outra frase de tamanho médio aqui",
            "Mais uma frase de tamanho médio", "Oi");
        var regions = new java.util.ArrayList<OcrManifest.Region>();
        for (int i = 0; i < boxes.size(); i++) regions.add(new OcrManifest.Region(new UUID(0, i + 1), i, "s" + i, boxes.get(i)));
        var ocr = new OcrManifest("1.0", JOB, "en", WIDTH, HEIGHT, regions);
        var input = new TranslationRequest(JOB, pair, regions.stream().map(r ->
            new TranslationRequest.Region(r.id(), r.readingOrder(), r.sourceText())).toList());
        var translated = new TranslationValidator(Set.of(pair)).validateResponse(input, new TranslationResponse(
            java.util.stream.IntStream.range(0, 4).mapToObj(i ->
                new TranslationResponse.Region(regions.get(i).id(), texts.get(i))).toList()));
        var request = RenderRequest.create(new RenderSource("image/png", 100, WIDTH, HEIGHT, "a".repeat(64)),
            ocr, translated, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
        var result = painter.paint(CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee), request);
        var sizes = result.stream().mapToInt(RenderManifest.Placement::fontSizePx).sorted().toArray();
        assertThat(result).noneMatch(RenderManifest.Placement::overflow);
        assertThat(sizes[3]).isLessThanOrEqualTo((int) Math.ceil((sizes[1] + sizes[2]) / 2.0 * 1.35));
    }

    @Test
    void shortLineInTightPolygonGrowsIntoFlatBalloonButNeverCrossesItsBorder() {
        var small = CleanBoxPainterTest.rectangle(.45, .72, .55, .77); // ~36x11 px: "Claro!" cannot fit at all
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        int borderLeft = 110, borderRight = 250, borderTop = 130, borderBottom = 212;
        outline(image, borderLeft, borderTop, borderRight, borderBottom, 0xff000000);
        var original = copy(image);
        var result = painter.paint(image, page(image, List.of(
            CleanBoxPainterTest.rectangle(.02, .02, .3, .3), CleanBoxPainterTest.rectangle(.35, .02, .63, .3),
            CleanBoxPainterTest.rectangle(.68, .02, .96, .3), small),
            List.of("Uma frase média aqui", "Outra frase média aqui", "Mais uma frase média", "Claro!")));
        var sizes = result.subList(0, 3).stream().mapToInt(RenderManifest.Placement::fontSizePx).sorted().toArray();
        var claro = result.get(3);
        assertThat(claro.overflow()).isFalse();
        assertThat(claro.fontSizePx()).isGreaterThanOrEqualTo((int) Math.ceil(sizes[1] * .75));
        int paintedOutsidePolygon = 0;
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
            boolean insideBalloon = x > borderLeft && x < borderRight && y > borderTop && y < borderBottom;
            if (y < HEIGHT * .31) continue; // top row regions paint their own text
            if (!insideBalloon) assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(original.getRGB(x, y));
            else if (!shape(small).contains(x + .5, y + .5) && image.getRGB(x, y) != original.getRGB(x, y)) paintedOutsidePolygon++;
        }
        assertThat(paintedOutsidePolygon).isPositive();
    }

    @Test
    void horizontalTranslationOfNarrowVerticalJapaneseColumnsGrowsTowardsTheSourceGlyphSize() {
        // Two vertical columns (~25 px glyphs) in a wide balloon: confined to the columns, "comunicação" forces a
        // tiny font. The page median cannot notice (it is made of such columns); the source glyph size does.
        var columns = CleanBoxPainterTest.rectangle(165 / 360.0, 30 / 220.0, 215 / 360.0, 180 / 220.0);
        int borderLeft = 95, borderRight = 285, borderTop = 15, borderBottom = 200;
        var text = List.of("Eu tenho trabalho no comitê de comunicação");
        var english = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        outline(english, borderLeft, borderTop, borderRight, borderBottom, 0xff000000);
        var japanese = copy(english);
        var original = copy(english);
        int confined = painter.paint(english, page(english, List.of(columns), text)).getFirst().fontSizePx();
        var grown = painter.paint(japanese, page(japanese, List.of(columns), text, "ja", List.of("あたしは通信委員の仕事がある"))).getFirst();
        assertThat(grown.overflow()).isFalse();
        assertThat(grown.fontSizePx()).isGreaterThan(confined + 3);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
            boolean insideBalloon = x > borderLeft && x < borderRight && y > borderTop && y < borderBottom;
            if (!insideBalloon) assertThat(japanese.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(original.getRGB(x, y));
        }
    }

    @Test
    void tallColumnInAnOvalBalloonWidensThroughTheBalloonMiddle() {
        // The column's ends nearly touch the curved border, so only a band around its middle can widen.
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        double cx = 180, cy = 110, rx = 120, ry = 100;
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
            double d = Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2);
            if (d >= 1 && d <= 1.06) image.setRGB(x, y, 0xff000000);
        }
        var original = copy(image);
        var column = CleanBoxPainterTest.rectangle(168 / 360.0, 22 / 220.0, 192 / 360.0, 198 / 220.0);
        var result = painter.paint(image, page(image, List.of(column), List.of("A tela ficou com um visual impressionante"),
            "ja", List.of("なんか画面がすごいことに"))).getFirst();
        assertThat(result.overflow()).isFalse();
        assertThat(result.fontSizePx()).isGreaterThanOrEqualTo(20);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
            if (Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2) >= .98)
                assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(original.getRGB(x, y));
        }
    }

    @Test
    void compressionNoiseAroundSourceTextDoesNotBlockGrowthAndIsCleanedWithTheGrownBox() {
        var small = CleanBoxPainterTest.rectangle(.45, .72, .55, .77);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        int noise = 0xffcccccc; // between background (<=30) and ink (>120) distance, like JPEG ringing
        for (int y = 152; y < 176; y++) for (int x = 156; x < 204; x++)
            if ((x < 162 || x >= 198 || y < 158 || y >= 170) && (x + y) % 3 == 0) image.setRGB(x, y, noise);
        var result = painter.paint(image, page(image, List.of(
            CleanBoxPainterTest.rectangle(.02, .02, .3, .3), CleanBoxPainterTest.rectangle(.35, .02, .63, .3),
            CleanBoxPainterTest.rectangle(.68, .02, .96, .3), small),
            List.of("Uma frase média aqui", "Outra frase média aqui", "Mais uma frase média", "Claro!")));
        var sizes = result.subList(0, 3).stream().mapToInt(RenderManifest.Placement::fontSizePx).sorted().toArray();
        assertThat(result.get(3).overflow()).isFalse();
        assertThat(result.get(3).fontSizePx()).isGreaterThanOrEqualTo((int) Math.ceil(sizes[1] * .75));
        for (int y = 152; y < 176; y++) for (int x = 156; x < 204; x++)
            assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isNotEqualTo(noise);
    }

    @Test
    void sparseCompressionHaloIsCleanedButBalloonBorderAndItsAntialiasingStay() {
        var polygon = CleanBoxPainterTest.rectangle(.3, .3, .7, .7); // x 108..252, y 66..154
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        int noise = 0xffdddddd, antialias = 0xffdddddd; // distance 102 from white: not background, not ink
        for (int y = 58; y < 162; y++) for (int x = 100; x < 108; x++) if ((x + y) % 5 == 0) image.setRGB(x, y, noise);
        for (int y = 58; y < 66; y++) for (int x = 108; x < 252; x++) if ((x + y) % 4 == 0) image.setRGB(x, y, 0xfffafafa); // faint, distance 15
        for (int y = 66; y < 154; y++) { image.setRGB(258, y, 0xff000000); image.setRGB(257, y, antialias); }
        painter.paint(image, request("pt-BR", "Oi", polygon));
        for (int y = 58; y < 162; y++) for (int x = 100; x < 108; x++)
            assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(0xffffffff);
        for (int y = 58; y < 66; y++) for (int x = 108; x < 252; x++)
            assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(0xffffffff);
        for (int y = 66; y < 154; y++) {
            assertThat(image.getRGB(258, y)).isEqualTo(0xff000000);
            assertThat(image.getRGB(257, y)).isEqualTo(antialias);
        }
    }

    @Test
    void denseScreentoneAroundTheRegionIsNotMistakenForHalo() {
        var polygon = CleanBoxPainterTest.rectangle(.3, .3, .7, .7);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) if ((x + y) % 2 == 0) image.setRGB(x, y, 0xffdddddd);
        var original = copy(image);
        painter.paint(image, request("pt-BR", "Oi", polygon));
        var path = shape(polygon);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++)
            if (!path.contains(x + .5, y + .5)) assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(original.getRGB(x, y));
    }

    @Test
    void polygonOvershootingTheBalloonCleansOnlyItsInteriorAndKeepsBorderAndArtBeyond() {
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        outline(image, 60, 40, 220, 180, 0xff000000); // balloon border
        for (int y = 0; y < HEIGHT; y++) for (int x = 221; x < WIDTH; x++) if ((x + y) % 6 == 0) image.setRGB(x, y, 0xff333333); // art
        for (int y = 95; y < 115; y++) for (int x = 100; x < 180; x += 8) { image.setRGB(x, y, 0xff000000); image.setRGB(x + 1, y, 0xff000000); }
        var original = copy(image);
        var polygon = CleanBoxPainterTest.rectangle(80 / 360.0, 70 / 220.0, 290 / 360.0, 150 / 220.0); // crosses x=220
        var result = painter.paint(image, request("pt-BR", "Oi", polygon));
        assertThat(result.getFirst().overflow()).isFalse();
        for (int y = 0; y < HEIGHT; y++) for (int x = 220; x < WIDTH; x++)
            assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(original.getRGB(x, y));
        assertThat(image.getRGB(100, 96)).isNotEqualTo(0xff000000); // source glyph stroke erased
    }

    @Test
    void textDrawnOverArtworkKeepsTheOriginalAndIsReported() {
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++)
            if (x % 7 == 0 || y % 11 == 0) image.setRGB(x, y, 0xff000000); // continuous strokes, like drawn art
        var original = copy(image);
        var result = painter.paint(image, request("pt-BR", "Oi", CleanBoxPainterTest.rectangle(.3, .3, .7, .7)));
        assertThat(result.getFirst().overflow()).isTrue();
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++)
            assertThat(image.getRGB(x, y)).isEqualTo(original.getRGB(x, y));
    }

    @Test
    void translationEqualToTheSourceKeepsTheOriginalLettering() {
        var polygon = CleanBoxPainterTest.rectangle(.3, .3, .7, .7);
        var pair = new LanguagePair("en", "pt-BR");
        var ocr = new OcrManifest("1.0", JOB, "en", WIDTH, HEIGHT, List.of(new OcrManifest.Region(REGION, 0, "FREEK\n", polygon)));
        var input = new TranslationRequest(JOB, pair, List.of(new TranslationRequest.Region(REGION, 0, "FREEK\n")));
        var translation = new TranslationValidator(Set.of(pair)).validateResponse(input,
            new TranslationResponse(List.of(new TranslationResponse.Region(REGION, " FREEK"))));
        var request = RenderRequest.create(new RenderSource("image/png", 100, WIDTH, HEIGHT, "a".repeat(64)),
            ocr, translation, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        image.setRGB(180, 110, 0xff000000);
        var result = painter.paint(image, request);
        assertThat(result.getFirst().overflow()).isTrue();
        assertThat(image.getRGB(180, 110)).isEqualTo(0xff000000);
    }

    @Test
    void wordWiderThanTheBalloonIsNeverSplitMidWord() {
        var narrowAndTall = CleanBoxPainterTest.rectangle(.45, .1, .55, .9); // ~36 x 176 px: room for many short lines
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        var result = painter.paint(image, request("pt-BR", "Inconstitucionalissimamente", narrowAndTall));
        assertThat(result.getFirst().overflow()).isTrue();
        var fits = painter.paint(CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff), request("pt-BR", "Oi tu", narrowAndTall));
        assertThat(fits.getFirst().overflow()).isFalse();
    }

    @Test
    void detectedBalloonBoundsHowFarAShortLineMayGrow() {
        var small = CleanBoxPainterTest.rectangle(.45, .72, .55, .77); // "Claro!" in an open flat area
        var boxes = List.of(CleanBoxPainterTest.rectangle(.02, .02, .3, .3), CleanBoxPainterTest.rectangle(.35, .02, .63, .3),
            CleanBoxPainterTest.rectangle(.68, .02, .96, .3), small);
        var texts = List.of("Uma frase média aqui", "Outra frase média aqui", "Mais uma frase média", "Claro!");
        var free = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        var unbounded = painter.paint(free, page(free, boxes, texts)).get(3);
        var bounded = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        // A detected balloon hugging the line: growth stops at the balloon (+15% slack), so the text stays smaller.
        var balloon = new com.toonlira.translationgateway.domain.layout.LayoutBox(.44, .70, .56, .79);
        var request = page(bounded, boxes, texts).withBubbles(List.of(balloon));
        var inBalloon = painter.paint(bounded, request).get(3);
        assertThat(inBalloon.overflow()).isFalse();
        assertThat(inBalloon.fontSizePx()).isLessThan(unbounded.fontSizePx());
        int x0 = (int) Math.floor((.44 - .018) * WIDTH), x1 = (int) Math.ceil((.56 + .018) * WIDTH);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++)
            if (y > HEIGHT * .32 && (x < x0 || x >= x1)) assertThat(bounded.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(0xffffffff);
        // A balloon that does not contain the region changes nothing.
        var elsewhere = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        var unrelated = page(elsewhere, boxes, texts).withBubbles(List.of(new com.toonlira.translationgateway.domain.layout.LayoutBox(.0, .0, .1, .1)));
        assertThat(painter.paint(elsewhere, unrelated).get(3).fontSizePx()).isEqualTo(unbounded.fontSizePx());
    }

    @Test
    void speechOverArtworkIsInpaintedAndRetypedWithAnOutlineOnlyWhenHinted() {
        var polygon = CleanBoxPainterTest.rectangle(.3, .3, .7, .7); // x 108..252, y 66..154
        var calls = new java.util.ArrayList<int[]>();
        Inpainter white = (image, box) -> {
            calls.add(box);
            for (int y = Math.max(0, box[1]); y < Math.min(HEIGHT, box[3]); y++)
                for (int x = Math.max(0, box[0]); x < Math.min(WIDTH, box[2]); x++) image.setRGB(x, y, 0xffffffff);
            return true;
        };
        var inpainting = new PageRasterPainter(FONTS, white);
        var art = artwork();
        var hinted = request("pt-BR", "Obrigado por tudo", polygon);
        assertThatThrownBy(() -> hinted.withCaptionHints(Set.of(UUID.randomUUID())))
            .isInstanceOf(com.toonlira.translationgateway.domain.rendering.RenderValidationException.class);
        var result = inpainting.paint(art, hinted.withCaptionHints(Set.of(REGION)));
        assertThat(result.getFirst().overflow()).isFalse();
        assertThat(calls).hasSize(1);
        assertThat(calls.getFirst()).containsExactly(104, 62, 256, 158); // polygon bounds + 4 px
        int black = 0, white2 = 0;
        for (int y = 66; y < 154; y++) for (int x = 108; x < 252; x++) {
            int rgb = art.getRGB(x, y) & 0xffffff;
            if (rgb == 0) black++;
            if (rgb == 0xffffff) white2++;
        }
        assertThat(black).isPositive(); // the lettering
        assertThat(white2).isPositive(); // reconstructed artwork and outline
        // Without the hint (a sound effect) or without an inpainter, text over artwork keeps its original lettering.
        var untouched = artwork();
        assertThat(inpainting.paint(untouched, hinted).getFirst().overflow()).isTrue();
        assertThat(painter.paint(artwork(), hinted.withCaptionHints(Set.of(REGION))).getFirst().overflow()).isTrue();
        assertThat(calls).hasSize(1);
        assertThat(sameAs(untouched, artwork())).isTrue();
    }

    @Test
    void textInAScreentoneBalloonIsInpaintedInsteadOfLeavingAFlatPatch() {
        var polygon = CleanBoxPainterTest.rectangle(135 / 360.0, 75 / 220.0, 225 / 360.0, 145 / 220.0);
        var calls = new java.util.ArrayList<int[]>();
        Inpainter recorder = (image, box) -> { calls.add(box); return true; };
        var tone = screentoneBalloon(true);
        var original = copy(tone);
        var result = new PageRasterPainter(FONTS, recorder).paint(tone, request("pt-BR", "Obrigado por tudo", polygon));
        assertThat(result.getFirst().overflow()).isFalse();
        assertThat(calls).hasSize(1);
        // Away from the text box the screentone is intact: no flat fill was spread over it.
        for (int y = 24; y < 196; y++) for (int x = 64; x < 296; x++) {
            boolean nearText = x >= 125 && x < 235 && y >= 65 && y < 155;
            if (!nearText) assertThat(tone.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(original.getRGB(x, y));
        }
        // A plain balloon keeps the flat clean (no inpainting); without an inpainter nothing changes either.
        new PageRasterPainter(FONTS, recorder).paint(screentoneBalloon(false), request("pt-BR", "Obrigado por tudo", polygon));
        assertThat(calls).hasSize(1);
        assertThat(painter.paint(screentoneBalloon(true), request("pt-BR", "Obrigado por tudo", polygon)).getFirst().overflow()).isFalse();
    }

    /** White balloon (border 60..300 x 20..200), lettering bars inside 140..220 x 80..140, optional 2x2 tone dots. */
    private static BufferedImage screentoneBalloon(boolean dots) {
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        outline(image, 60, 20, 300, 200, 0xff000000);
        if (dots) for (int y = 26; y < 196; y += 8) for (int x = 66; x < 296; x += 8) {
            if (x >= 136 && x < 224 && y >= 76 && y < 144) continue; // the lettering area
            for (int dy = 0; dy < 2; dy++) for (int dx = 0; dx < 2; dx++) image.setRGB(x + dx, y + dy, 0xff000000);
        }
        for (int bar = 0; bar < 6; bar++)
            for (int y = 85; y < 135; y++) for (int x = 145 + bar * 12; x < 150 + bar * 12; x++) image.setRGB(x, y, 0xff000000);
        return image;
    }

    @Test
    void bigTextInAPlainBoxIsOrdinaryTextNotHandLettering() {
        // A page of instructions: large lettering on plain paper inside a box. Even with the lettering hint (drawn
        // bigger than the page median) it stays ordinary text: no inpainting, no heavy outlined face.
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        outline(image, 40, 30, 320, 190, 0xff000000);
        for (int bar = 0; bar < 10; bar++)
            for (int y = 80; y < 140; y++) for (int x = 70 + bar * 22; x < 78 + bar * 22; x++) image.setRGB(x, y, 0xff000000);
        var polygon = CleanBoxPainterTest.rectangle(65 / 360.0, 75 / 220.0, 295 / 360.0, 145 / 220.0);
        var calls = new java.util.ArrayList<int[]>();
        Inpainter recorder = (raster, box) -> { calls.add(box); return true; };
        var result = new PageRasterPainter(FONTS, recorder).paint(image,
            request("pt-BR", "Esta HQ é apresentada no formato original", polygon).withLetteringHints(Set.of(REGION)));
        assertThat(result.getFirst().overflow()).isFalse();
        assertThat(calls).isEmpty();
    }

    @Test
    void cleanedTextOnAGradientFollowsTheGradientInsteadOfAFlatPatch() {
        // Background from light grey (left) to white (right), with dark "lettering" in the middle.
        var image = new BufferedImage(360, 220, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < 220; y++) for (int x = 0; x < 360; x++) {
            int v = 215 + x * 40 / 359;
            image.setRGB(x, y, 0xff000000 | v << 16 | v << 8 | v);
        }
        for (int bar = 0; bar < 6; bar++)
            for (int y = 95; y < 125; y++) for (int x = 70 + bar * 42; x < 76 + bar * 42; x++) image.setRGB(x, y, 0xff000000);
        var polygon = CleanBoxPainterTest.rectangle(60 / 360.0, 80 / 220.0, 300 / 360.0, 140 / 220.0);
        var result = new PageRasterPainter(FONTS).paint(image, request("pt-BR", "Pare", polygon));
        assertThat(result.getFirst().overflow()).isFalse();
        // Every repainted background pixel (light, not the new glyphs or their antialiasing) matches the gradient
        // at its column: a flat fill would be off by up to 20 levels at the ends.
        int repainted = 0, off = 0;
        for (int y = 0; y < 220; y++) for (int x = 0; x < 360; x++) {
            int value = image.getRGB(x, y) & 255, gradient = 215 + x * 40 / 359;
            boolean wasInk = x >= 70 && x < 286 && y >= 95 && y < 125 && ((x - 70) % 42) < 6;
            if (!wasInk || value < 200 || nearDark(image, x, y)) continue;
            repainted++;
            if (Math.abs(value - gradient) > 6) off++;
        }
        assertThat(repainted).isPositive();
        assertThat(off).isZero();
    }

    /** Antialiasing of a glyph just drawn: any dark pixel within two pixels. */
    private static boolean nearDark(BufferedImage image, int x, int y) {
        for (int dy = -2; dy <= 2; dy++) for (int dx = -2; dx <= 2; dx++) {
            int nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < image.getWidth() && ny < image.getHeight() && (image.getRGB(nx, ny) & 255) < 150) return true;
        }
        return false;
    }

    @Test
    void drawnTextKeepsItsDrawingEvenOnPlainPaper() {
        // "bin" lettered on white paper: the flat path could retype it, but drawn text that is not speech stays.
        var image = new BufferedImage(360, 220, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < 220; y++) for (int x = 0; x < 360; x++) image.setRGB(x, y, 0xffffffff);
        for (int bar = 0; bar < 6; bar++)
            for (int y = 90; y < 130; y++) for (int x = 120 + bar * 18; x < 126 + bar * 18; x++) image.setRGB(x, y, 0xff000000);
        var before = new BufferedImage(360, 220, BufferedImage.TYPE_INT_ARGB);
        before.getGraphics().drawImage(image, 0, 0, null);
        var polygon = CleanBoxPainterTest.rectangle(110 / 360.0, 85 / 220.0, 240 / 360.0, 135 / 220.0);
        var plain = new PageRasterPainter(FONTS).paint(image, request("pt-BR", "lixeira", polygon));
        assertThat(plain.getFirst().overflow()).isFalse(); // without the hint it would be retyped

        for (int y = 0; y < 220; y++) for (int x = 0; x < 360; x++) image.setRGB(x, y, before.getRGB(x, y));
        var kept = new PageRasterPainter(FONTS).paint(image, request("pt-BR", "lixeira", polygon).withDrawnHints(Set.of(REGION)));
        assertThat(kept.getFirst().overflow()).isTrue();
        assertThat(sameAs(image, before)).isTrue();
    }

    @Test
    void failedInpaintingKeepsTheOriginalLettering() {
        var polygon = CleanBoxPainterTest.rectangle(.3, .3, .7, .7);
        var failing = new PageRasterPainter(FONTS, (image, box) -> false);
        var art = artwork();
        var result = failing.paint(art, request("pt-BR", "Obrigado por tudo", polygon).withCaptionHints(Set.of(REGION)));
        assertThat(result.getFirst().overflow()).isTrue();
        assertThat(sameAs(art, artwork())).isTrue();
    }

    private static BufferedImage artwork() {
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffffffff);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++)
            if (x % 7 == 0 || y % 11 == 0) image.setRGB(x, y, 0xff000000); // continuous strokes, like drawn art
        return image;
    }

    private static boolean sameAs(BufferedImage a, BufferedImage b) {
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) if (a.getRGB(x, y) != b.getRGB(x, y)) return false;
        return true;
    }

    @Test
    void texturedSurroundingsDoNotGrowAndNeighbouringRegionIsLeftAlone() {
        var small = CleanBoxPainterTest.rectangle(.30, .72, .40, .77);
        var neighbour = CleanBoxPainterTest.rectangle(.42, .65, .70, .85);
        var image = CleanBoxPainterTest.fixture(WIDTH, HEIGHT, 0xffeeeeee);
        for (int y = 120; y < HEIGHT; y++) for (int x = 0; x < 100; x++) if ((x + y) % 2 == 0) image.setRGB(x, y, 0xff888888);
        var original = copy(image);
        var result = painter.paint(image, page(image, List.of(
            CleanBoxPainterTest.rectangle(.02, .02, .3, .3), CleanBoxPainterTest.rectangle(.35, .02, .63, .3),
            CleanBoxPainterTest.rectangle(.68, .02, .96, .3), small, neighbour),
            List.of("Uma frase média aqui", "Outra frase média aqui", "Mais uma frase média", "Claro!",
                "texto longo demais ".repeat(200))));
        assertThat(result.get(4).overflow()).isTrue();
        assertThat(changedInside(image, neighbour, 0xffeeeeee)).isZero();
        for (int y = 120; y < HEIGHT; y++) for (int x = 0; x < 100; x++)
            assertThat(image.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(original.getRGB(x, y));
    }

    private static RenderRequest page(BufferedImage image, List<List<OcrManifest.Vertex>> boxes, List<String> texts) {
        return page(image, boxes, texts, "en", null);
    }

    private static RenderRequest page(BufferedImage image, List<List<OcrManifest.Vertex>> boxes, List<String> texts,
                                      String source, List<String> sourceTexts) {
        var pair = new LanguagePair(source, "pt-BR");
        var regions = new java.util.ArrayList<OcrManifest.Region>();
        for (int i = 0; i < boxes.size(); i++)
            regions.add(new OcrManifest.Region(new UUID(0, i + 1), i, sourceTexts == null ? "s" + i : sourceTexts.get(i), boxes.get(i)));
        var ocr = new OcrManifest("1.0", JOB, source, image.getWidth(), image.getHeight(), regions);
        var input = new TranslationRequest(JOB, pair, regions.stream().map(r ->
            new TranslationRequest.Region(r.id(), r.readingOrder(), r.sourceText())).toList());
        var translated = new TranslationValidator(Set.of(pair)).validateResponse(input, new TranslationResponse(
            java.util.stream.IntStream.range(0, boxes.size()).mapToObj(i ->
                new TranslationResponse.Region(regions.get(i).id(), texts.get(i))).toList()));
        return RenderRequest.create(new RenderSource("image/png", 100, image.getWidth(), image.getHeight(), "a".repeat(64)),
            ocr, translated, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
    }

    private static void outline(BufferedImage image, int left, int top, int right, int bottom, int color) {
        for (int x = left; x <= right; x++) { image.setRGB(x, top, color); image.setRGB(x, bottom, color); }
        for (int y = top; y <= bottom; y++) { image.setRGB(left, y, color); image.setRGB(right, y, color); }
    }

    private static BufferedImage copy(BufferedImage original) {
        var image = new BufferedImage(original.getWidth(), original.getHeight(), BufferedImage.TYPE_INT_ARGB);
        image.setData(original.getData());
        return image;
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
