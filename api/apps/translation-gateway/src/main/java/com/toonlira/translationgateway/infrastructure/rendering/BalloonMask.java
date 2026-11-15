package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;
import java.util.List;

/**
 * Pixel mask of the balloon around one OCR region, computed on the untouched raster.
 *
 * <p>The balloon interior is the largest flat (4-connected, colour close to the cleaning colour) component inside the
 * polygon. Source glyphs are the non-flat blobs it encloses: they cannot reach the window edge without crossing it
 * (8-connected). Balloon borders, artwork and sound effects drawn outside the balloon do reach the edge, so they are
 * never cleaned or painted over, even when the OCR polygon overshoots the balloon.
 */
final class BalloonMask {
    static final int MARGIN_PX = CleanBoxPainter.HALO_PX + 4;
    private static final int FLAT = 1, BALLOON = 2, OUTSIDE = 4, CLEAN = 8, ALLOWED = 16, GLYPH = 32;
    private final int left, top, width, height;
    private final byte[] state;
    /** Tiny enclosed blobs (screentone dots) at most this many pixels. */
    static final int DOT_MAX_PX = 12;
    /** Dots outside the polygon from which the balloon background counts as screentone. */
    static final int MIN_TONE_DOTS = 15;
    private final double enclosedInk;
    private final boolean screentone;

    private BalloonMask(int left, int top, int width, int height, byte[] state, double enclosedInk, boolean screentone) {
        this.left = left; this.top = top; this.width = width; this.height = height;
        this.state = state; this.enclosedInk = enclosedInk; this.screentone = screentone;
    }

    static BalloonMask of(BufferedImage image, RasterPolygon polygon, List<RasterPolygon> others, int argb) {
        return of(image, polygon, others, argb, null);
    }

    /** {@code limit}: when a detected balloon bounds the region, flat pixels beyond it are not balloon interior. */
    static BalloonMask of(BufferedImage image, RasterPolygon polygon, List<RasterPolygon> others, int argb,
                          RasterPolygon.Bounds limit) {
        var bounds = polygon.bounds();
        int left = Math.max(0, bounds.left() - MARGIN_PX), right = Math.min(image.getWidth(), bounds.right() + MARGIN_PX);
        int top = Math.max(0, bounds.top() - MARGIN_PX), bottom = Math.min(image.getHeight(), bounds.bottom() + MARGIN_PX);
        int width = Math.max(0, right - left), height = Math.max(0, bottom - top);
        var state = new byte[width * height];
        var inside = new boolean[width * height];
        var ink = new boolean[width * height];
        for (int y = 0; y < height; y++) {
            CleanBoxPainter.checkInterrupted();
            var span = polygon.span(top + y);
            for (int x = 0; x < width; x++) {
                int i = y * width + x, distance = CleanBoxPainter.distance(image.getRGB(left + x, top + y), argb);
                boolean inLimit = limit == null || left + x >= limit.left() && left + x < limit.right()
                    && top + y >= limit.top() && top + y < limit.bottom();
                if (distance <= CleanBoxPainter.BACKGROUND_DISTANCE && inLimit) state[i] |= FLAT;
                inside[i] = span != null && left + x >= span.start() && left + x < span.end();
                ink[i] = distance > CleanBoxPainter.INK_DISTANCE;
            }
        }
        markLargestFlatComponent(state, inside, width, height);
        markOutside(state, width, height);
        int dots = markGlyphs(state, inside, ink, width, height);
        int inkInside = 0, enclosedInkInside = 0;
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int i = y * width + x;
            boolean balloon = (state[i] & BALLOON) != 0, enclosed = (state[i] & GLYPH) != 0;
            if (inside[i] && ink[i]) { inkInside++; if (enclosed) enclosedInkInside++; }
            // Overlaps inside the own polygon resolve in OCR order, as before; outside it other regions are off limits.
            if (!(balloon || enclosed) || !inside[i] && insideAny(others, left + x, top + y)) continue;
            state[i] |= ALLOWED;
            if (inside[i] && balloon || enclosed) state[i] |= CLEAN;
        }
        return new BalloonMask(left, top, width, height, state, inkInside == 0 ? 1 : (double) enclosedInkInside / inkInside,
            dots >= MIN_TONE_DOTS);
    }

    /** The plain clean-box policy: every polygon pixel is cleaned and may be drawn on. */
    static BalloonMask polygonOnly(RasterPolygon polygon) {
        var bounds = polygon.bounds();
        int width = Math.max(0, bounds.right() - bounds.left()), height = Math.max(0, bounds.bottom() - bounds.top());
        var state = new byte[width * height];
        java.util.Arrays.fill(state, (byte) OUTSIDE);
        for (int y = 0; y < height; y++) {
            var span = polygon.span(bounds.top() + y);
            if (span == null) continue;
            for (int x = Math.max(span.start(), bounds.left()); x < Math.min(span.end(), bounds.right()); x++)
                state[y * width + x - bounds.left()] = (byte) (CLEAN | ALLOWED | GLYPH);
        }
        return new BalloonMask(bounds.left(), bounds.top(), width, height, state, 1, false);
    }

    /** Enclosed non-glyph pixel: a speck not touching the polygon nor reaching the window edge (compression noise). */
    boolean enclosedSpeck(int x, int y) {
        if (x < left || y < top || x >= left + width || y >= top + height) return false;
        int s = state[(y - top) * width + x - left];
        return (s & (BALLOON | OUTSIDE | GLYPH)) == 0;
    }

    /**
     * The balloon background is screentone: many tiny dots around the text, outside its polygon (lettering has no
     * dots outside its own box). Filling such a balloon with one colour erases the tone under the text — a patch.
     */
    boolean screentone() { return screentone; }

    /** Share of the source ink in the polygon that sits inside the balloon and will therefore be erased. */
    double enclosedInk() { return enclosedInk; }

    /** Pixels the region may clean and draw on: balloon interior or enclosed glyphs, never another region. */
    boolean allowed(int x, int y) {
        if (x < left || y < top || x >= left + width || y >= top + height) return false;
        return (state[(y - top) * width + x - left] & ALLOWED) != 0;
    }

    boolean clean(int x, int y) {
        return x >= left && y >= top && x < left + width && y < top + height && (state[(y - top) * width + x - left] & CLEAN) != 0;
    }

    void fill(BufferedImage image, int argb) {
        for (int y = 0; y < height; y++) {
            CleanBoxPainter.checkInterrupted();
            for (int x = 0; x < width; x++) if ((state[y * width + x] & CLEAN) != 0) image.setRGB(left + x, top + y, argb);
        }
    }

    /** Shrinks {@code box} edge by edge, dropping the edge with most forbidden pixels, until every pixel is allowed. */
    RasterPolygon.Bounds fit(RasterPolygon.Bounds box) {
        int l = box.left(), t = box.top(), r = box.right(), b = box.bottom();
        while (l < r && t < b) {
            CleanBoxPainter.checkInterrupted();
            int leftBad = 0, rightBad = 0, topBad = 0, bottomBad = 0;
            for (int y = t; y < b; y++) { if (!allowed(l, y)) leftBad++; if (!allowed(r - 1, y)) rightBad++; }
            for (int x = l; x < r; x++) { if (!allowed(x, t)) topBad++; if (!allowed(x, b - 1)) bottomBad++; }
            int worst = Math.max(Math.max(leftBad, rightBad), Math.max(topBad, bottomBad));
            if (worst == 0) {
                // Edges are clean; interior forbidden pixels (art islands) still shrink the box from the nearest side.
                int bad = firstForbiddenRow(l, t, r, b);
                if (bad < 0) return new RasterPolygon.Bounds(l, t, r, b);
                if (bad - t < b - bad) t = bad + 1; else b = bad;
                continue;
            }
            if (worst == leftBad) l++;
            else if (worst == rightBad) r--;
            else if (worst == topBad) t++;
            else b--;
        }
        return new RasterPolygon.Bounds(box.left(), box.top(), box.left(), box.top());
    }

    private int firstForbiddenRow(int l, int t, int r, int b) {
        for (int y = t; y < b; y++) for (int x = l; x < r; x++) if (!allowed(x, y)) return y;
        return -1;
    }

    private static void markLargestFlatComponent(byte[] state, boolean[] inside, int width, int height) {
        var component = new int[state.length];
        var queue = new int[state.length];
        int best = 0, bestInside = 0, next = 0;
        for (int start = 0; start < state.length; start++) {
            if ((state[start] & FLAT) == 0 || component[start] != 0) continue;
            int id = ++next, head = 0, tail = 0, count = 0;
            component[start] = id; queue[tail++] = start;
            while (head < tail) {
                int i = queue[head++], x = i % width, y = i / width;
                if (inside[i]) count++;
                if (x > 0) tail = visitFlat(state, component, queue, tail, i - 1, id);
                if (x < width - 1) tail = visitFlat(state, component, queue, tail, i + 1, id);
                if (y > 0) tail = visitFlat(state, component, queue, tail, i - width, id);
                if (y < height - 1) tail = visitFlat(state, component, queue, tail, i + width, id);
            }
            if (count > bestInside) { bestInside = count; best = id; }
            if ((start & 0xffff) == 0) CleanBoxPainter.checkInterrupted();
        }
        if (best == 0) return;
        for (int i = 0; i < state.length; i++) if (component[i] == best) state[i] |= BALLOON;
    }

    private static int visitFlat(byte[] state, int[] component, int[] queue, int tail, int i, int id) {
        if ((state[i] & FLAT) == 0 || component[i] != 0) return tail;
        component[i] = id; queue[tail] = i;
        return tail + 1;
    }

    private static void markOutside(byte[] state, int width, int height) {
        var queue = new int[state.length];
        int head = 0, tail = 0;
        for (int i = 0; i < state.length; i++) {
            int x = i % width, y = i / width;
            if ((x == 0 || y == 0 || x == width - 1 || y == height - 1) && (state[i] & BALLOON) == 0) {
                state[i] |= OUTSIDE; queue[tail++] = i;
            }
        }
        while (head < tail) {
            int i = queue[head++], x = i % width, y = i / width;
            for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                int nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                int n = ny * width + nx;
                if ((state[n] & (BALLOON | OUTSIDE)) != 0) continue;
                state[n] |= OUTSIDE; queue[tail++] = n;
            }
            if ((head & 0xffff) == 0) CleanBoxPainter.checkInterrupted();
        }
    }

    /**
     * Enclosed blobs (neither balloon nor reachable from the window edge) touching the polygon are source glyphs.
     * A blob entirely outside the polygon is artwork or decoration inside the balloon and stays untouched.
     * Returns how many of those outside blobs are tiny dots of ink ({@link #DOT_MAX_PX}): the screentone signal.
     * JPEG specks are light (not ink) and do not count.
     */
    private static int markGlyphs(byte[] state, boolean[] inside, boolean[] ink, int width, int height) {
        int dots = 0;
        var seen = new boolean[state.length];
        var queue = new int[state.length];
        for (int start = 0; start < state.length; start++) {
            if (seen[start] || (state[start] & (BALLOON | OUTSIDE)) != 0) continue;
            int head = 0, tail = 0;
            boolean touches = false, inked = false;
            seen[start] = true; queue[tail++] = start;
            while (head < tail) {
                int i = queue[head++], x = i % width, y = i / width;
                touches |= inside[i];
                inked |= ink[i];
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                    int nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                    int n = ny * width + nx;
                    if (seen[n] || (state[n] & (BALLOON | OUTSIDE)) != 0) continue;
                    seen[n] = true; queue[tail++] = n;
                }
            }
            if (touches) for (int k = 0; k < tail; k++) state[queue[k]] |= GLYPH;
            else if (tail <= DOT_MAX_PX && inked) dots++;
            CleanBoxPainter.checkInterrupted();
        }
        return dots;
    }

    private static boolean insideAny(List<RasterPolygon> polygons, int x, int y) {
        for (var polygon : polygons) if (polygon.contains(x, y)) return true;
        return false;
    }
}
