package com.toonlira.translationgateway.domain.layout;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RegularPanelDetectorTest {
    private final RegularPanelDetector detector = new RegularPanelDetector();

    @Test
    void detectsThreePanelsWithoutOuterMarginsAndPreservesVerticalOrder() {
        var image = new Fixture(200, 300);
        image.fill(10, 10, 190, 90, 0);
        image.fill(10, 100, 190, 190, 0);
        image.fill(10, 200, 190, 290, 0);

        var panels = detector.detect(image, ReadingDirection.ltr);

        assertThat(panels).hasSize(3);
        assertThat(panels.getFirst().bounds()).isEqualTo(new LayoutBox(.05, 10.0 / 300, .95, .3));
        assertThat(panels).extracting(panel -> panel.bounds().top()).isSorted();
    }

    @Test
    void reversesOnlyVerticalCutsForRtl() {
        var image = new Fixture(200, 100);
        image.fill(10, 10, 90, 90, 0);
        image.fill(110, 10, 190, 90, 0);

        assertThat(detector.detect(image, ReadingDirection.ltr).getFirst().bounds().left()).isEqualTo(.05);
        assertThat(detector.detect(image, ReadingDirection.rtl).getFirst().bounds().left()).isEqualTo(.55);
    }

    @Test
    void equalProportionalGuttersPreferHorizontalCut() {
        var image = new Fixture(100, 100);
        image.fill(0, 0, 45, 45, 0);
        image.fill(55, 0, 100, 45, 0);
        image.fill(0, 55, 45, 100, 0);
        image.fill(55, 55, 100, 100, 0);

        assertThat(detector.detect(image, ReadingDirection.ltr)).extracting(Panel::bounds)
            .containsExactly(new LayoutBox(0, 0, .45, .45), new LayoutBox(.55, 0, 1, .45),
                new LayoutBox(0, .55, .45, 1), new LayoutBox(.55, .55, 1, 1));
    }

    @Test
    void returnsNoInventedPanelForBlankUnsplitOrDarkGutter() {
        var image = new Fixture(100, 100);
        assertThat(detector.detect(image, ReadingDirection.ltr)).isEmpty();
        image.fill(0, 0, 100, 100, 0);
        assertThat(detector.detect(image, ReadingDirection.ltr)).isEmpty();
        image.fill(0, 45, 100, 55, 0xefefef);
        assertThat(detector.detect(image, ReadingDirection.ltr)).isEmpty();
    }

    @Test
    void rejectsTinyFragmentsAndTooNarrowSeparators() {
        var image = new Fixture(1000, 1000);
        image.fill(0, 0, 1000, 1000, 0);
        image.fill(0, 10, 1000, 20, 0xffffff);
        image.fill(0, 500, 1000, 504, 0xffffff);
        assertThat(detector.detect(image, ReadingDirection.ltr)).isEmpty();
    }

    @Test
    void allowsAtMostHalfPercentDarkPixelsInSeparator() {
        var image = new Fixture(1000, 200);
        image.fill(0, 0, 1000, 200, 0);
        image.fill(0, 95, 1000, 105, 0xf0f0f0);
        image.fill(0, 95, 5, 105, 0);
        assertThat(detector.detect(image, ReadingDirection.ltr)).hasSize(2);
        image.fill(5, 95, 6, 105, 0);
        assertThat(detector.detect(image, ReadingDirection.ltr)).isEmpty();
    }

    @Test
    void directionIsExplicitAndCancellationIsCooperative() {
        var image = new Fixture(100, 100);
        assertThatThrownBy(() -> detector.detect(image, null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> detector.detect(image, ReadingDirection.ltr, () -> true))
            .isInstanceOf(LayoutFailure.class).hasMessage("layout-timeout");
    }

    private static final class Fixture implements PixelImage {
        private final int width;
        private final int height;
        private final int[] pixels;

        Fixture(int width, int height) {
            this.width = width;
            this.height = height;
            pixels = new int[width * height];
            Arrays.fill(pixels, 0xffffff);
        }

        void fill(int left, int top, int right, int bottom, int rgb) {
            for (int y = top; y < bottom; y++) Arrays.fill(pixels, y * width + left, y * width + right, rgb);
        }

        public int width() { return width; }
        public int height() { return height; }
        public int rgb(int x, int y) { return pixels[y * width + x]; }
    }
}
