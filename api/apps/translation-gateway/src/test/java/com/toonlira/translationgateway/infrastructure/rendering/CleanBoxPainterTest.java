package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CleanBoxPainterTest {
    private static final int BACKGROUND = 0x7fa4c1e3;
    private static final int INK = 0xff010203;
    private final CleanBoxPainter painter = new CleanBoxPainter();

    @Test
    void neutralizesRectangleButPreservesEveryOutsidePixelAndCallerOriginal() {
        var polygon = rectangle(.2, .2, .7, .6);
        var original = fixture(40, 30, BACKGROUND);
        ink(original, polygon);
        var working = copy(original);
        var result = painter.clean(working, request(40, 30, List.of(polygon)));
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().argb()).isEqualTo(BACKGROUND);
        for (int y = 0; y < 30; y++) for (int x = 0; x < 40; x++) {
            boolean inside = x >= 8 && x < 28 && y >= 6 && y < 18;
            assertThat(working.getRGB(x, y)).isEqualTo(inside ? BACKGROUND : original.getRGB(x, y));
            assertThat(original.getRGB(x, y)).isEqualTo(inside ? INK : BACKGROUND);
        }
        assertThatThrownBy(result::clear).isInstanceOf(UnsupportedOperationException.class);
        assertThat(result.getFirst().toString()).isEqualTo("CleanRegion[redacted]");
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void inclinedPolygonIsNotExpandedToBoundingBoxInEitherVertexDirection(boolean reverse) {
        var polygon = new ArrayList<>(List.of(vertex(.501, .101), vertex(.901, .501),
            vertex(.501, .901), vertex(.101, .501)));
        if (reverse) Collections.reverse(polygon);
        var original = fixture(37, 31, BACKGROUND);
        ink(original, polygon);
        var working = copy(original);
        painter.clean(working, request(37, 31, List.of(polygon)));
        assertOutsideUnchanged(original, working, List.of(polygon));
        assertThat(working.getRGB(18, 15)).isEqualTo(BACKGROUND);
        assertThat(working.getRGB(4, 4)).isEqualTo(original.getRGB(4, 4));
    }

    @Test
    void clipsAtImageEdgesWithoutWrappingCoordinatesOrInventingExternalPixels() {
        var polygon = rectangle(0, 0, .4, .6);
        var original = fixture(11, 7, BACKGROUND);
        ink(original, polygon);
        var working = copy(original);
        var result = painter.clean(working, request(11, 7, List.of(polygon)));
        assertThat(result.getFirst().argb()).isEqualTo(BACKGROUND);
        assertOutsideUnchanged(original, working, List.of(polygon));
        assertThat(working.getRGB(0, 0)).isEqualTo(BACKGROUND);
        assertThat(working.getRGB(10, 6)).isEqualTo(BACKGROUND);
    }

    @Test
    void computesColorsBeforePaintingAndResolvesOverlapInOcrOrder() {
        var first = rectangle(.15, .2, .65, .65);
        var second = rectangle(.4, .4, .85, .85);
        var original = fixture(100, 100, BACKGROUND);
        for (int y = 0; y < 100; y++) for (int x = 60; x < 100; x++) original.setRGB(x, y, 0xffe3c1a4);
        ink(original, first);
        ink(original, second);
        var working = copy(original);
        var regions = painter.clean(working, request(100, 100, List.of(first, second)));
        assertThat(working.getRGB(50, 50)).isEqualTo(regions.get(1).argb());
        assertThat(working.getRGB(20, 25)).isEqualTo(regions.getFirst().argb());
        assertOutsideUnchanged(original, working, List.of(first, second));
        var repeated = copy(original);
        var other = painter.clean(repeated, request(100, 100, List.of(first, second)));
        assertThat(other.stream().map(CleanBoxPainter.CleanRegion::argb).toList())
            .isEqualTo(regions.stream().map(CleanBoxPainter.CleanRegion::argb).toList());
        assertPixelsEqual(working, repeated);
    }

    @Test
    void surroundsExcludeAllOcrRegionsNotJustTheRegionBeingEstimated() {
        var first = rectangle(.2, .2, .5, .5);
        var covering = rectangle(.1, .1, .6, .6);
        var image = fixture(40, 40, BACKGROUND);
        ink(image, covering);
        var result = painter.clean(image, request(40, 40, List.of(first, covering)));
        assertThat(result.getFirst().argb()).isEqualTo(0xffffffff);
        assertThat(result.get(1).argb()).isEqualTo(BACKGROUND);
        assertThat(image.getRGB(12, 12)).isEqualTo(BACKGROUND);
    }

    @Test
    void fullPageWithoutSurroundingSampleUsesExplicitWhiteNotSourceInk() {
        var image = fixture(2, 2, INK);
        var result = painter.clean(image, request(2, 2, List.of(rectangle(0, 0, 1, 1))));
        assertThat(result.getFirst().argb()).isEqualTo(0xffffffff);
        for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++) assertThat(image.getRGB(x, y)).isEqualTo(0xffffffff);
    }

    @Test
    void emptyPagePreservesTransparentHiddenRgbExactlyAndDoesNotCreateRegion() {
        var image = fixture(13, 17, 0x00123456);
        image.setRGB(6, 8, 0x01020304);
        var original = copy(image);
        assertThat(painter.clean(image, request(13, 17, List.of()))).isEmpty();
        assertPixelsEqual(original, image);
    }

    @Test
    void subpixelRegionIsNotExpandedAndHasNoPaintablePixel() {
        var polygon = rectangle(.100, .100, .102, .102);
        var image = fixture(10, 10, BACKGROUND);
        var original = copy(image);
        var result = painter.clean(image, request(10, 10, List.of(polygon)));
        assertThat(result.getFirst().polygon().hasPixels()).isFalse();
        assertPixelsEqual(original, image);
    }

    @Test
    void surroundingMedianRejectsSparseInkNoiseInsteadOfAveragingItIntoBackground() {
        var polygon = rectangle(.25, .25, .75, .75);
        var image = fixture(40, 40, BACKGROUND);
        ink(image, polygon);
        image.setRGB(8, 8, INK);
        image.setRGB(20, 8, INK);
        image.setRGB(31, 31, INK);
        assertThat(painter.clean(image, request(40, 40, List.of(polygon))).getFirst().argb()).isEqualTo(BACKGROUND);
        assertThat(image.getRGB(8, 8)).isEqualTo(INK);
    }

    @Test
    void deterministicRotatedFixturesVerifyAllOutsidePixelsAgainstIndependentPathGeometry() {
        var random = new Random(20261003);
        for (int sample = 0; sample < 128; sample++) {
            double angle = random.nextDouble() * Math.PI * 2;
            double halfWidth = .08 + random.nextDouble() * .2, halfHeight = .05 + random.nextDouble() * .15;
            var polygon = new ArrayList<OcrManifest.Vertex>();
            for (double[] corner : new double[][]{{-halfWidth, -halfHeight}, {halfWidth, -halfHeight},
                {halfWidth, halfHeight}, {-halfWidth, halfHeight}}) {
                polygon.add(vertex(.5 + corner[0] * Math.cos(angle) - corner[1] * Math.sin(angle),
                    .5 + corner[0] * Math.sin(angle) + corner[1] * Math.cos(angle)));
            }
            if (sample % 2 == 0) Collections.reverse(polygon);
            var original = fixture(39, 27, BACKGROUND);
            ink(original, polygon);
            var working = copy(original);
            painter.clean(working, request(39, 27, List.of(polygon)));
            assertOutsideUnchanged(original, working, List.of(polygon));
            var independent = shape(polygon, 39, 27);
            var interior = new RasterPolygon(polygon, 39, 27).interiorBox(2);
            for (int y = interior.top(); y < interior.bottom(); y++) for (int x = interior.left(); x < interior.right(); x++)
                assertThat(independent.contains(x + .5, y + .5)).isTrue();
            for (int y = 0; y < 27; y++) for (int x = 0; x < 39; x++) {
                if (independent.contains(x + .5, y + .5)) assertThat(working.getRGB(x, y)).isEqualTo(BACKGROUND);
            }
        }
    }

    @Test
    void invalidRasterFailsBeforeMutationAndErrorHasNoContentOrCause() {
        var image = fixture(5, 5, BACKGROUND);
        var original = copy(image);
        assertThatThrownBy(() -> painter.clean(image, request(6, 5, List.of())))
            .isInstanceOf(RenderPaintingException.class).hasMessage("paint-invalid-input").hasNoCause();
        assertThatThrownBy(() -> painter.clean(null, request(5, 5, List.of())))
            .isInstanceOf(RenderPaintingException.class).hasMessage("paint-invalid-input").hasNoCause();
        assertThatThrownBy(() -> painter.clean(image, null)).isInstanceOf(RenderPaintingException.class);
        assertThatThrownBy(() -> painter.clean(new BufferedImage(5, 5, BufferedImage.TYPE_INT_RGB), request(5, 5, List.of())))
            .isInstanceOf(RenderPaintingException.class);
        assertPixelsEqual(original, image);
    }

    @Test
    void interruptionFailsWithoutClearingFlagOrTouchingRaster() {
        var image = fixture(5, 5, BACKGROUND);
        var original = copy(image);
        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> painter.clean(image, request(5, 5, List.of(rectangle(0, 0, 1, 1)))))
                .isInstanceOf(RenderPaintingException.class).hasMessage("paint-cancelled").hasNoCause();
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
            assertPixelsEqual(original, image);
        } finally { Thread.interrupted(); }
    }

    static RenderRequest request(int width, int height, List<List<OcrManifest.Vertex>> polygons) {
        UUID job = UUID.fromString("12345678-1234-1234-1234-123456789012");
        var pair = new LanguagePair("ja", "pt-BR");
        var regions = new ArrayList<OcrManifest.Region>();
        for (int i = 0; i < polygons.size(); i++) regions.add(new OcrManifest.Region(new UUID(0, i + 1), i, "source", polygons.get(i)));
        var ocr = new OcrManifest("1.0", job, "ja", width, height, regions);
        var input = new TranslationRequest(job, pair, regions.stream()
            .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
        var output = new TranslationResponse(regions.stream().map(region -> new TranslationResponse.Region(region.id(), "translation")).toList());
        var translated = new TranslationValidator(Set.of(pair)).validateResponse(input, output);
        return RenderRequest.create(new RenderSource("image/png", 100, width, height, "a".repeat(64)),
            ocr, translated, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
    }

    private static OcrManifest.Vertex vertex(double x, double y) { return new OcrManifest.Vertex(x, y); }
    static List<OcrManifest.Vertex> rectangle(double x0, double y0, double x1, double y1) {
        return List.of(vertex(x0, y0), vertex(x1, y0), vertex(x1, y1), vertex(x0, y1));
    }
    static BufferedImage fixture(int width, int height, int color) {
        var image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) image.setRGB(x, y, color);
        return image;
    }
    private static BufferedImage copy(BufferedImage original) {
        var image = new BufferedImage(original.getWidth(), original.getHeight(), BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < image.getHeight(); y++) for (int x = 0; x < image.getWidth(); x++) image.setRGB(x, y, original.getRGB(x, y));
        return image;
    }
    private static void ink(BufferedImage image, List<OcrManifest.Vertex> polygon) {
        var shape = shape(polygon, image.getWidth(), image.getHeight());
        for (int y = 0; y < image.getHeight(); y++) for (int x = 0; x < image.getWidth(); x++)
            if (shape.contains(x + .5, y + .5)) image.setRGB(x, y, INK);
    }
    private static Path2D shape(List<OcrManifest.Vertex> points, int width, int height) {
        var shape = new Path2D.Double();
        shape.moveTo(points.getFirst().x() * width, points.getFirst().y() * height);
        for (int i = 1; i < points.size(); i++) shape.lineTo(points.get(i).x() * width, points.get(i).y() * height);
        shape.closePath();
        return shape;
    }
    private static void assertOutsideUnchanged(BufferedImage original, BufferedImage working, List<List<OcrManifest.Vertex>> polygons) {
        var shapes = polygons.stream().map(p -> shape(p, original.getWidth(), original.getHeight())).toList();
        for (int y = 0; y < original.getHeight(); y++) for (int x = 0; x < original.getWidth(); x++) {
            double cx = x + .5, cy = y + .5;
            if (shapes.stream().noneMatch(s -> s.contains(cx, cy))) assertThat(working.getRGB(x, y)).isEqualTo(original.getRGB(x, y));
        }
    }
    private static void assertPixelsEqual(BufferedImage a, BufferedImage b) {
        for (int y = 0; y < a.getHeight(); y++) for (int x = 0; x < a.getWidth(); x++) assertThat(a.getRGB(x, y)).isEqualTo(b.getRGB(x, y));
    }
}
