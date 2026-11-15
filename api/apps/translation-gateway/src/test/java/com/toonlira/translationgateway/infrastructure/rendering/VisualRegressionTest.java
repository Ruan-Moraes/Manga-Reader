package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Visual regression on generated scenes, one per rendering rule, each with expectations per region: overflow, a
 * font floor, no source ink left beside the new text, nothing changed outside the balloon (or text box), and the
 * original kept byte for byte when it must be. A rule change that breaks any of them fails here, not on a page.
 */
class VisualRegressionTest {
    private static final BundledRenderingFonts FONTS = new BundledRenderingFonts();
    private static final int W = 600, H = 400;

    /** {@code overflow}: expected flag; {@code minFont}: floor when drawn; {@code identical}: original kept as is. */
    record Expect(int region, boolean overflow, int minFont, boolean identical) { }

    record Scene(String name, BufferedImage image, RenderRequest request, Inpainter inpainter, List<Rectangle> allowed,
                 List<Expect> expectations) {
        @Override public String toString() { return name; }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("scenes")
    void everyRegionMeetsItsExpectations(Scene scene) {
        var before = RegionChecks.copy(scene.image());
        var after = RegionChecks.copy(scene.image());
        var placements = new PageRasterPainter(FONTS, scene.inpainter()).paint(after, scene.request());
        assertThat(RegionChecks.changedOutside(before, after, scene.allowed()))
            .as("pixels changed outside the balloon, within %s", RegionChecks.changedOutsideBounds(before, after, scene.allowed())).isZero();
        for (var expect : scene.expectations()) {
            var placement = placements.get(expect.region());
            var region = RegionChecks.bounds(scene.request().regions().get(expect.region()).polygon(), W, H);
            assertThat(placement.overflow()).as("region %d overflow", expect.region()).isEqualTo(expect.overflow());
            if (expect.identical()) assertThat(RegionChecks.identical(before, after, region)).as("region %d original kept", expect.region()).isTrue();
            if (!expect.overflow()) {
                assertThat(placement.fontSizePx()).as("region %d font", expect.region()).isGreaterThanOrEqualTo(expect.minFont());
                if (!expect.identical()) assertThat(RegionChecks.residualInk(before, after, region)).as("region %d source ink left", expect.region()).isZero();
            }
        }
    }

    static Stream<Arguments> scenes() {
        return Stream.of(shortLineFloor(), narrowVerticalJapanese(), ovalBalloon(), speechOverArtwork(), soundEffectOverArtwork(),
            screentoneBalloon(), unchangedTranslation(), overflowKeepsOriginal(), slantedShout()).map(Arguments::of);
    }

    private static Rectangle box(int l, int t, int r, int b) { return new Rectangle(l, t, r - l + 1, b - t + 1); }

    private static List<com.toonlira.translationgateway.domain.OcrManifest.Vertex> polygon(int l, int t, int r, int b) {
        return CleanBoxPainterTest.rectangle(l / (double) W, t / (double) H, r / (double) W, b / (double) H);
    }

    private static BufferedImage paper() { return CleanBoxPainterTest.fixture(W, H, 0xffffffff); }

    private static BufferedImage art() {
        var image = paper();
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) if (x % 7 == 0 || y % 11 == 0) image.setRGB(x, y, 0xff000000);
        return image;
    }

    /** Three medium speeches and a short "Claro!" in a tight polygon inside a wide balloon: the floor grows it. */
    private static Scene shortLineFloor() {
        var image = paper();
        var texts = new java.util.ArrayList<RegionChecks.Text>();
        String[] medium = {"Uma frase média aqui", "Outra frase média aqui", "Mais uma frase média"};
        for (int i = 0; i < 3; i++) {
            int left = 20 + i * 195;
            RegionChecks.outline(image, left, 20, left + 180, 150);
            RegionChecks.bars(image, left + 40, 60, left + 140, 110);
            texts.add(new RegionChecks.Text("A medium line of speech", medium[i], polygon(left + 35, 55, left + 145, 115)));
        }
        RegionChecks.outline(image, 180, 200, 420, 380);
        RegionChecks.bars(image, 280, 280, 320, 296);
        texts.add(new RegionChecks.Text("Sure thing", "Claro!", polygon(275, 276, 325, 300)));
        return new Scene("fala curta em balão liso", image, RegionChecks.request(image, "en", texts), null,
            List.of(box(20, 20, 590, 150), box(180, 200, 420, 380)),
            List.of(new Expect(3, false, 14, false), new Expect(0, false, 14, false)));
    }

    /** Two vertical Japanese columns in a wide balloon: the horizontal translation must not shrink to the columns. */
    private static Scene narrowVerticalJapanese() {
        var image = paper();
        RegionChecks.outline(image, 160, 20, 440, 380);
        RegionChecks.bars(image, 285, 60, 315, 340);
        var texts = List.of(new RegionChecks.Text("あたしは通信委員の仕事がある", "Eu tenho trabalho no comitê de comunicação",
            polygon(280, 55, 320, 345)));
        return new Scene("coluna vertical japonesa estreita", image, RegionChecks.request(image, "ja", texts), null,
            List.of(box(160, 20, 440, 380)), List.of(new Expect(0, false, 22, false)));
    }

    /** A tall column whose ends touch an oval balloon's curve: the middle band widens. */
    private static Scene ovalBalloon() {
        var image = paper();
        double cx = 300, cy = 200, rx = 200, ry = 180;
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
            double d = Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2);
            if (d >= 1 && d <= 1.04) image.setRGB(x, y, 0xff000000);
        }
        RegionChecks.bars(image, 285, 40, 315, 360);
        var texts = List.of(new RegionChecks.Text("なんか画面がすごいことに", "A tela ficou com um visual impressionante", polygon(280, 35, 320, 365)));
        return new Scene("balão oval", image, RegionChecks.request(image, "ja", texts), null,
            List.of(box(100, 20, 500, 380)), List.of(new Expect(0, false, 24, false)));
    }

    /** Speech over artwork with a caption hint: rebuilt by the inpainter and retyped. */
    private static Scene speechOverArtwork() {
        var image = art();
        var texts = List.of(new RegionChecks.Text("Thank you for everything", "Obrigado por tudo", polygon(180, 120, 420, 280)));
        var request = RegionChecks.request(image, "en", texts).withCaptionHints(Set.of(new UUID(0, 1)));
        Inpainter white = (raster, area) -> {
            for (int y = Math.max(0, area[1]); y < Math.min(H, area[3]); y++)
                for (int x = Math.max(0, area[0]); x < Math.min(W, area[2]); x++) raster.setRGB(x, y, 0xffffffff);
            return true;
        };
        return new Scene("fala sobre a arte com dica", image, request, white, List.of(box(176, 116, 424, 284)),
            List.of(new Expect(0, false, 20, false)));
    }

    /** The same lettering without a hint (a sound effect): the drawing stays. */
    private static Scene soundEffectOverArtwork() {
        var image = art();
        var texts = List.of(new RegionChecks.Text("clatter clatter", "clac clac", polygon(180, 120, 420, 280)));
        return new Scene("SFX sobre a arte", image, RegionChecks.request(image, "en", texts), (raster, area) -> true,
            List.of(), List.of(new Expect(0, true, 0, true)));
    }

    /** Light screentone in the balloon: the text is inpainted, the tone away from it is never flattened. */
    private static Scene screentoneBalloon() {
        var image = paper();
        RegionChecks.outline(image, 60, 20, 540, 380);
        for (int y = 26; y < 376; y += 8) for (int x = 66; x < 536; x += 8) {
            if (x >= 216 && x < 384 && y >= 136 && y < 264) continue;
            for (int d = 0; d < 4; d++) image.setRGB(x + d % 2, y + d / 2, 0xff000000);
        }
        RegionChecks.bars(image, 225, 150, 375, 250);
        var texts = List.of(new RegionChecks.Text("Thank you for everything", "Obrigado por tudo", polygon(215, 135, 385, 265)));
        Inpainter erase = (raster, area) -> {
            for (int y = Math.max(0, area[1]); y < Math.min(H, area[3]); y++)
                for (int x = Math.max(0, area[0]); x < Math.min(W, area[2]); x++) raster.setRGB(x, y, 0xffffffff);
            return true;
        };
        return new Scene("balão com retícula", image, RegionChecks.request(image, "en", texts), erase,
            List.of(box(205, 125, 395, 275)), List.of(new Expect(0, false, 14, false)));
    }

    /** A hand-drawn shout over the art, slanted: retyped in the heavy face, following the slant, inside its box. */
    private static Scene slantedShout() {
        var image = art();
        double tilt = .2, cx = 300, cy = 200, hw = 160, hh = 50;
        var corners = new java.util.ArrayList<com.toonlira.translationgateway.domain.OcrManifest.Vertex>();
        for (double[] c : new double[][]{{-hw, -hh}, {hw, -hh}, {hw, hh}, {-hw, hh}}) {
            double x = cx + c[0] * Math.cos(tilt) - c[1] * Math.sin(tilt), y = cy + c[0] * Math.sin(tilt) + c[1] * Math.cos(tilt);
            corners.add(new com.toonlira.translationgateway.domain.OcrManifest.Vertex(x / W, y / H));
        }
        var texts = List.of(new RegionChecks.Text("ターミナルがあれば全てが上手くいく", "Com um terminal, tudo dá certo!", corners));
        var request = RegionChecks.request(image, "ja", texts).withLetteringHints(Set.of(new UUID(0, 1)));
        Inpainter erase = (raster, area) -> {
            for (int y = Math.max(0, area[1]); y < Math.min(H, area[3]); y++)
                for (int x = Math.max(0, area[0]); x < Math.min(W, area[2]); x++) raster.setRGB(x, y, 0xffffffff);
            return true;
        };
        var bounds = RegionChecks.bounds(corners, W, H);
        bounds.grow(5, 5);
        return new Scene("letreiro à mão inclinado", image, request, erase, List.of(bounds), List.of(new Expect(0, false, 24, false)));
    }

    /** A translation equal to the source ("AKANE!"): the hand lettering is kept. */
    private static Scene unchangedTranslation() {
        var image = paper();
        RegionChecks.outline(image, 160, 100, 440, 300);
        RegionChecks.bars(image, 220, 170, 380, 230);
        var texts = List.of(new RegionChecks.Text("AKANE!", "AKANE!", polygon(215, 165, 385, 235)));
        return new Scene("tradução igual ao original", image, RegionChecks.request(image, "en", texts), null,
            List.of(), List.of(new Expect(0, true, 0, true)));
    }

    /** A translation far too long for its balloon: the original stays instead of an erased balloon. */
    private static Scene overflowKeepsOriginal() {
        var image = paper();
        RegionChecks.outline(image, 270, 180, 330, 220);
        RegionChecks.bars(image, 280, 190, 320, 210);
        var texts = List.of(new RegionChecks.Text("Hi", " tradução completa ".repeat(60), polygon(278, 188, 322, 212)));
        return new Scene("tradução que não cabe", image, RegionChecks.request(image, "en", texts), null,
            List.of(), List.of(new Expect(0, true, 0, true)));
    }
}
