package com.toonlira.translationgateway.domain.ocr;

import java.util.ArrayList;
import java.util.List;

/**
 * Packs re-read tiles into one image so all of a page's doubtful regions cost a single extra OCR call (the
 * provider bills per image, not per pixel). Shelf packing left to right, top to bottom, with a white gap wide
 * enough that the provider never merges text of neighbouring tiles. Side by side the gap is at least the tile's own
 * height: enlarged single glyphs (a lone 「あ」 at 3x) are taller than {@link #GAP}, and the provider read a row of
 * them as one line ("あらららら").
 */
public final class MosaicLayout {
    public static final int GAP = 48;
    public static final int MAX_WIDTH = 3000, MAX_HEIGHT = 9000;

    public record Tile(int x, int y, int width, int height) {
        public boolean containsCenterOf(double left, double top, double right, double bottom) {
            double cx = (left + right) / 2, cy = (top + bottom) / 2;
            return cx >= x && cx < x + width && cy >= y && cy < y + height;
        }
    }

    /** Tiles in input order (null when a tile did not fit) and the canvas size. */
    public record Layout(List<Tile> tiles, int width, int height) { }

    public static Layout pack(List<int[]> sizes) {
        var tiles = new ArrayList<Tile>(sizes.size());
        int x = GAP, y = GAP, shelf = 0, width = 0;
        for (var size : sizes) {
            int w = size[0], h = size[1];
            if (w <= 0 || h <= 0 || w + 2 * GAP > MAX_WIDTH) { tiles.add(null); continue; }
            if (x + w + GAP > MAX_WIDTH) { x = GAP; y += shelf + GAP; shelf = 0; }
            if (y + h + GAP > MAX_HEIGHT) { tiles.add(null); continue; }
            tiles.add(new Tile(x, y, w, h));
            width = Math.max(width, x + w + GAP);
            x += w + Math.max(GAP, h);
            shelf = Math.max(shelf, h);
        }
        return new Layout(tiles, Math.max(width, 2 * GAP), y + shelf + GAP);
    }

    /** True when a word box overlaps two or more tiles: the provider joined lettering of different crops. */
    public static boolean spansTiles(Layout layout, double left, double top, double right, double bottom) {
        int touched = 0;
        for (var tile : layout.tiles()) {
            if (tile != null && left < tile.x() + tile.width() && right > tile.x() && top < tile.y() + tile.height()
                && bottom > tile.y() && ++touched > 1) return true;
        }
        return false;
    }

    public static int tileOf(Layout layout, double left, double top, double right, double bottom) {
        for (int i = 0; i < layout.tiles().size(); i++) {
            var tile = layout.tiles().get(i);
            if (tile != null && tile.containsCenterOf(left, top, right, bottom)) return i;
        }
        return -1;
    }
}
