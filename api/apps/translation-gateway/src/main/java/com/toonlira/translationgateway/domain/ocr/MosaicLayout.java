package com.toonlira.translationgateway.domain.ocr;

import java.util.ArrayList;
import java.util.List;

/**
 * Packs re-read tiles into one image so all of a page's doubtful regions cost a single extra OCR call (the
 * provider bills per image, not per pixel). Shelf packing left to right, top to bottom, with a white gap wide
 * enough that the provider never merges text of neighbouring tiles.
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
            x += w + GAP;
            shelf = Math.max(shelf, h);
            width = Math.max(width, x);
        }
        return new Layout(tiles, Math.max(width, 2 * GAP), y + shelf + GAP);
    }

    public static int tileOf(Layout layout, double left, double top, double right, double bottom) {
        for (int i = 0; i < layout.tiles().size(); i++) {
            var tile = layout.tiles().get(i);
            if (tile != null && tile.containsCenterOf(left, top, right, bottom)) return i;
        }
        return -1;
    }
}
