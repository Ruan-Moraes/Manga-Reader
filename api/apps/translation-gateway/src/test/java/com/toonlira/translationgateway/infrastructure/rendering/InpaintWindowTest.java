package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import org.junit.jupiter.api.Test;

class InpaintWindowTest {
    private static final int PINK = 0xffffe1d2, WHITE = 0xfffffffa, BLACK = 0xff101010, ART = 0xff8a5a30;

    /**
     * Pink page; black letters each stroked with a 4 px white outline that spills 2 px above and below the OCR box
     * (84..116); a brown art line well to the right.
     */
    private static BufferedImage page() {
        var image = new BufferedImage(800, 600, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 600; y++) for (int x = 0; x < 800; x++) image.setRGB(x, y, PINK);
        for (int x = 100; x < 300; x += 12) {
            for (int y = 82; y < 118; y++) for (int dx = -4; dx < 10; dx++) image.setRGB(x + dx, y, WHITE);   // outline
            for (int y = 86; y < 114; y++) for (int dx = 0; dx < 6; dx++) image.setRGB(x + dx, y, BLACK);    // letter
        }
        for (int y = 60; y < 140; y++) for (int x = 330; x < 334; x++) image.setRGB(x, y, ART);
        return image;
    }

    private static final int[] BOX = {96, 84, 306, 116};

    @Test
    void theMaskTakesTheLetteringsOutlineBeyondTheBoxButNeverTheArtBesideIt() {
        var window = InpaintWindow.prepare(page(), BOX);
        assertThat(window).isNotNull();
        int width = window.right() - window.left();
        var shape = window.shape();
        // The outline 2 px above the box joins, as an outline pixel (always replaced).
        assertThat(shape[(83 - window.top()) * width + 103 - window.left()]).isEqualTo(InpaintWindow.OUTLINE);
        // The pink paper beyond the outline is never taken for it.
        assertThat(shape[(76 - window.top()) * width + 103 - window.left()]).isNotEqualTo(InpaintWindow.OUTLINE);
        // The art line away from the lettering never joins.
        assertThat(window.left() + width <= 332 || shape[(100 - window.top()) * width + 332 - window.left()] == 0).isTrue();
    }

    @Test
    void lettersOnPaperOfTheOutlineColourKeepTheBoxAsTheirMask() {
        // Dark letters on a white balloon: the light pixels are the paper, not an outline to follow or force.
        var image = new BufferedImage(800, 600, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 600; y++) for (int x = 0; x < 800; x++) image.setRGB(x, y, WHITE);
        for (int y = 86; y < 114; y++) for (int x = 100; x < 300; x += 12)
            for (int dx = 0; dx < 6; dx++) image.setRGB(x + dx, y, BLACK);
        var window = InpaintWindow.prepare(image, new int[]{98, 80, 302, 120});
        int width = window.right() - window.left();
        var shape = window.shape();
        assertThat(shape[(76 - window.top()) * width + 200 - window.left()]).isZero();          // paper beyond the box
        assertThat(shape[(100 - window.top()) * width + 99 - window.left()]).isEqualTo(InpaintWindow.IN_SHAPE);
    }

    @Test
    void theOutlineIsReplacedEvenWhenTheModelOnlyTurnsItIntoPaleTones() {
        var image = page();
        var window = InpaintWindow.prepare(image, BOX);
        // The model's answer: plain pink paper everywhere (white -> pink is a small change, below CHANGED).
        var back = new BufferedImage(window.side(), window.side(), BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < window.side(); y++) for (int x = 0; x < window.side(); x++) back.setRGB(x, y, PINK);
        InpaintWindow.paste(image, back, window.wx(), window.wy(), window.left(), window.top(), window.right(),
            window.bottom(), window.shape());
        assertThat(image.getRGB(103, 83) & 0xffffff).isEqualTo(PINK & 0xffffff);   // outline above the box gone
        assertThat(image.getRGB(103, 100) & 0xffffff).isEqualTo(PINK & 0xffffff);  // letter gone
        assertThat(image.getRGB(332, 100) & 0xffffff).isEqualTo(ART & 0xffffff);   // art untouched
        assertThat(image.getRGB(200, 30) & 0xffffff).isEqualTo(PINK & 0xffffff);   // far paper untouched
    }

    @Test
    void aLongTitleIsRebuiltInPiecesThatMaskTheWholeLetteringButEachWritesOnlyItsOwnPart() {
        // A 3000 px title line: one window would shrink it about 15x; pieces keep it near full size.
        var image = new BufferedImage(4000, 2000, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 2000; y++) for (int x = 0; x < 4000; x++) image.setRGB(x, y, PINK);
        for (int x = 500; x < 3500; x += 40) for (int y = 400; y < 460; y++) for (int dx = 0; dx < 20; dx++) image.setRGB(x + dx, y, BLACK);
        int[] box = {496, 396, 3504, 464};
        int pieces = InpaintWindow.pieces(image, box);
        assertThat(pieces).isEqualTo(InpaintWindow.MAX_PIECES);
        var first = InpaintWindow.prepare(image, box, 0);
        var second = InpaintWindow.prepare(image, box, 1);
        // Each writes its own slice only, and the slices tile the lettering.
        assertThat(first.paste()[2]).isEqualTo(second.paste()[0]);
        assertThat((double) first.side() / InpaintWindow.SIZE).isLessThanOrEqualTo(InpaintWindow.MAX_DOWNSCALE);
        // The second window also holds part of the first slice, and masks it: no letter left visible to complete.
        double scale = (double) InpaintWindow.SIZE / second.side();
        int x = (int) ((first.paste()[2] - 30 - second.wx()) * scale), y = (int) ((430 - second.wy()) * scale);
        assertThat(x).isPositive();
        assertThat(second.mask()[y * InpaintWindow.SIZE + x]).isEqualTo((byte) 1);
        // Same geometry when asked again on a page whose first piece is already rebuilt.
        var painted = new BufferedImage(4000, 2000, BufferedImage.TYPE_INT_RGB);
        for (int py = 0; py < 2000; py++) for (int px = 0; px < 4000; px++) painted.setRGB(px, py, PINK);
        assertThat(InpaintWindow.prepare(image, painted, box, 1).sameGeometry(second)).isTrue();
        assertThat(InpaintWindow.prepare(image, painted, box, 1).mask()).isEqualTo(second.mask());
    }
}
