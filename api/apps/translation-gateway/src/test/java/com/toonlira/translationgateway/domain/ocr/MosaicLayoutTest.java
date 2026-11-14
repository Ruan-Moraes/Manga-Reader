package com.toonlira.translationgateway.domain.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class MosaicLayoutTest {
    @Test
    void tilesNeverOverlapKeepAGapAndMapWordsBackByCentre() {
        var sizes = List.of(new int[]{1200, 300}, new int[]{1300, 200}, new int[]{900, 400}, new int[]{0, 0}, new int[]{5000, 10});
        var layout = MosaicLayout.pack(sizes);
        var tiles = layout.tiles();
        assertThat(tiles.get(3)).isNull();
        assertThat(tiles.get(4)).isNull(); // wider than the mosaic: skipped, not squeezed
        for (int i = 0; i < 3; i++) for (int j = i + 1; j < 3; j++) {
            var a = tiles.get(i); var b = tiles.get(j);
            boolean apart = a.x() + a.width() + MosaicLayout.GAP <= b.x() || b.x() + b.width() + MosaicLayout.GAP <= a.x()
                || a.y() + a.height() + MosaicLayout.GAP <= b.y() || b.y() + b.height() + MosaicLayout.GAP <= a.y();
            assertThat(apart).as("tiles %d and %d", i, j).isTrue();
        }
        assertThat(layout.width()).isLessThanOrEqualTo(MosaicLayout.MAX_WIDTH);
        var third = tiles.get(2);
        assertThat(MosaicLayout.tileOf(layout, third.x() + 10, third.y() + 10, third.x() + 50, third.y() + 30)).isEqualTo(2);
        assertThat(MosaicLayout.tileOf(layout, 1, 1, 5, 5)).isEqualTo(-1);
    }
}
