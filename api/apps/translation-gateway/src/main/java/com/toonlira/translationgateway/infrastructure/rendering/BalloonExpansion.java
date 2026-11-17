package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;
import java.util.List;

/**
 * Grows a layout box from the OCR interior box into the flat background around it (the balloon interior),
 * so short lines in tight OCR polygons are not forced into a tiny font. Growth stops at ink (balloon borders,
 * artwork), at any other OCR region, at the image edge, and after {@code limitPx} per side.
 */
final class BalloonExpansion {
    static final int BACKGROUND_DISTANCE = CleanBoxPainter.BACKGROUND_DISTANCE;
    static final int HALO_PX = CleanBoxPainter.HALO_PX;
    /** Distance kept from other regions' boxes, so their halo cleaning cannot erase strokes painted here. */
    private static final int GUARD_PX = 4;
    private static final int SIDES = 4;

    private BalloonExpansion() { }

    static RasterPolygon.Bounds expand(BufferedImage image, CleanBoxPainter.CleanRegion region,
                                       List<CleanBoxPainter.CleanRegion> all, List<RasterPolygon.Bounds> claimed,
                                       RasterPolygon.Bounds start, int limitPx) {
        return expand(image, region, all, claimed, start, limitPx, true);
    }

    /** With {@code vertical} false only the left and right sides grow (widening a line band first). */
    static RasterPolygon.Bounds expand(BufferedImage image, CleanBoxPainter.CleanRegion region,
                                       List<CleanBoxPainter.CleanRegion> all, List<RasterPolygon.Bounds> claimed,
                                       RasterPolygon.Bounds start, int limitPx, boolean vertical) {
        if (start.right() <= start.left() || start.bottom() <= start.top() || limitPx <= 0) return start;
        var scan = new Scan(image, region, all, claimed);
        int left = start.left(), top = start.top(), right = start.right(), bottom = start.bottom();
        var open = new boolean[]{true, true, vertical, vertical};
        var grown = new int[SIDES];
        boolean any = true;
        while (any) {
            any = false;
            for (int side = 0; side < SIDES; side++) {
                CleanBoxPainter.checkInterrupted();
                if (!open[side]) continue;
                // A detected balloon (with slack) bounds the growth like the image edge does.
                var bound = region.limit();
                int minX = bound == null ? 0 : bound.left(), maxX = bound == null ? image.getWidth() : bound.right();
                int minY = bound == null ? 0 : bound.top(), maxY = bound == null ? image.getHeight() : bound.bottom();
                boolean ok = switch (side) {
                    case 0 -> left > minX && scan.clearColumn(left - 1, top, bottom);
                    case 1 -> right < maxX && scan.clearColumn(right, top, bottom);
                    case 2 -> top > minY && scan.clearRow(top - 1, left, right);
                    default -> bottom < maxY && scan.clearRow(bottom, left, right);
                };
                if (!ok) { open[side] = false; continue; }
                switch (side) {
                    case 0 -> left--;
                    case 1 -> right++;
                    case 2 -> top--;
                    default -> bottom++;
                }
                if (++grown[side] >= limitPx) open[side] = false;
                any = true;
            }
        }
        return new RasterPolygon.Bounds(left, top, right, bottom);
    }

    private record Scan(BufferedImage image, CleanBoxPainter.CleanRegion region,
                        List<CleanBoxPainter.CleanRegion> all, List<RasterPolygon.Bounds> claimed) {
        boolean clearColumn(int x, int top, int bottom) {
            for (int y = top; y < bottom; y++) if (!background(x, y)) return false;
            return true;
        }

        boolean clearRow(int y, int left, int right) {
            for (int x = left; x < right; x++) if (!background(x, y)) return false;
            return true;
        }

        /** Mask pixels will be cleaned with the region; other pixels must be flat background. */
        private boolean background(int x, int y) {
            // Boxes already granted to other regions are painted whole; never share them.
            for (var box : claimed) if (x >= box.left() && x < box.right() && y >= box.top() && y < box.bottom()) return false;
            // Balloon interior and the enclosed source glyphs are cleaned with the region, so they never block.
            if (region.mask().allowed(x, y)) return true;
            int distance = CleanBoxPainter.distance(image.getRGB(x, y), region.argb());
            // Keep clear of other regions so their cleaning cannot erase strokes painted here.
            for (var other : all) {
                if (other == region) continue;
                var b = other.polygon().bounds();
                if (x >= b.left() - GUARD_PX && x < b.right() + GUARD_PX
                    && y >= b.top() - GUARD_PX && y < b.bottom() + GUARD_PX) return false;
            }
            if (distance <= Math.max(BACKGROUND_DISTANCE, region.mask().flatDistance())) return true;
            // Near the source text, non-ink compression noise is cleaned with the grown box, so it does not block.
            var own = region.polygon().bounds();
            return distance <= CleanBoxPainter.INK_DISTANCE && x >= own.left() - HALO_PX && x < own.right() + HALO_PX
                && y >= own.top() - HALO_PX && y < own.bottom() + HALO_PX;
        }
    }
}
