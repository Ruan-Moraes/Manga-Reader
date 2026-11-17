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
    /** Light halo of an outlined/glowing letter: cleaned with it, but not room the new text may take. */
    private static final int HALO = 64;
    /** Dark letter completed by {@link #markDarkGlyphs} (outlined/glowing lettering at the polygon's edge). */
    private static final int DARK = 128;
    private final int left, top, width, height;
    private final byte[] state;
    /** Tiny enclosed blobs (screentone dots) at most this many pixels. */
    static final int DOT_MAX_PX = 12;
    /** Dots outside the polygon from which the balloon background counts as screentone. */
    static final int MIN_TONE_DOTS = 15;
    private final double enclosedInk;
    private final boolean screentone;
    private int flatDistance = CleanBoxPainter.BACKGROUND_DISTANCE;

    private BalloonMask(int left, int top, int width, int height, byte[] state, double enclosedInk, boolean screentone) {
        this.left = left; this.top = top; this.width = width; this.height = height;
        this.state = state; this.enclosedInk = enclosedInk; this.screentone = screentone;
    }

    /** Distance to the balloon colour up to which a pixel counted as flat background for this mask. */
    int flatDistance() { return flatDistance; }

    static BalloonMask of(BufferedImage image, RasterPolygon polygon, List<RasterPolygon> others, int argb) {
        return of(image, polygon, others, argb, null);
    }

    /** {@code limit}: when a detected balloon bounds the region, flat pixels beyond it are not balloon interior. */
    static BalloonMask of(BufferedImage image, RasterPolygon polygon, List<RasterPolygon> others, int argb,
                          RasterPolygon.Bounds limit) {
        return of(image, polygon, others, argb, limit, false);
    }

    /** {@code noisyScan}: the page is an old printed scan ({@link #noisyScan}), whose paper is far from flat. */
    static BalloonMask of(BufferedImage image, RasterPolygon polygon, List<RasterPolygon> others, int argb,
                          RasterPolygon.Bounds limit, boolean noisyScan) {
        var bounds = polygon.bounds();
        int left = Math.max(0, bounds.left() - MARGIN_PX), right = Math.min(image.getWidth(), bounds.right() + MARGIN_PX);
        int top = Math.max(0, bounds.top() - MARGIN_PX), bottom = Math.min(image.getHeight(), bounds.bottom() + MARGIN_PX);
        int width = Math.max(0, right - left), height = Math.max(0, bottom - top);
        var state = new byte[width * height];
        var inside = new boolean[width * height];
        var ink = new boolean[width * height];
        var distances = new int[width * height];
        var colours = new int[width * height];
        for (int y = 0; y < height; y++) {
            CleanBoxPainter.checkInterrupted();
            var span = polygon.span(top + y);
            for (int x = 0; x < width; x++) {
                int i = y * width + x;
                colours[i] = image.getRGB(left + x, top + y);
                distances[i] = CleanBoxPainter.distance(colours[i], argb);
                inside[i] = span != null && left + x >= span.start() && left + x < span.end();
                ink[i] = distances[i] > CleanBoxPainter.INK_DISTANCE;
            }
        }
        // Inside a detected balloon the paper's own grain sets the bound too: a watercolour or aged balloon is far from
        // one colour, while clean paper keeps the fixed bound (flatTolerance never goes below it).
        int flat = noisyScan || limit != null ? flatTolerance(distances, inside, ink) : CleanBoxPainter.BACKGROUND_DISTANCE;
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int i = y * width + x;
            boolean inLimit = limit == null || left + x >= limit.left() && left + x < limit.right()
                && top + y >= limit.top() && top + y < limit.bottom();
            if (distances[i] <= flat && inLimit) state[i] |= FLAT;
        }
        markLargestFlatComponent(state, inside, width, height);
        markOutside(state, width, height, noisyScan);
        int dots = markGlyphs(state, inside, ink, width, height);
        // Only text the mask already sees on a plain background (most of its ink enclosed) gets its outlined or glowing
        // edge letters completed; lettering drawn over the art (sound effects, labels) stays exactly as before.
        if (enclosedShare(state, inside, ink) >= MIN_ENCLOSED_FOR_DARK_GLYPHS) markDarkGlyphs(state, inside, ink, width, height);
        markLetteringColours(state, inside, ink, colours, width, height);
        int inkInside = 0, enclosedInkInside = 0;
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int i = y * width + x;
            boolean balloon = (state[i] & BALLOON) != 0, enclosed = (state[i] & GLYPH) != 0;
            if (inside[i] && ink[i]) { inkInside++; if (enclosed) enclosedInkInside++; }
            // Overlaps inside the own polygon resolve in OCR order, as before; outside it other regions are off limits.
            if ((state[i] & HALO) != 0 && !(balloon || enclosed) && !(!inside[i] && insideAny(others, left + x, top + y))) {
                // Cleaned with its letter; inside the polygon the new text may use it, as the room around any glyph.
                state[i] |= inside[i] ? CLEAN | ALLOWED : CLEAN;
                continue;
            }
            if (!(balloon || enclosed) || !inside[i] && insideAny(others, left + x, top + y)) continue;
            state[i] |= ALLOWED;
            if (inside[i] && balloon || enclosed) state[i] |= CLEAN;
        }
        var mask = new BalloonMask(left, top, width, height, state, inkInside == 0 ? 1 : (double) enclosedInkInside / inkInside,
            dots >= MIN_TONE_DOTS);
        mask.flatDistance = flat;
        return mask;
    }

    /** Median local deviation from which a page is a noisy scan: digital and clean scans 0-3, 1940s print 8-19. */
    static final int NOISY_SCAN = 5;
    private static final int NOISE_STEP = 3;

    /**
     * Whether the page is an old printed scan: the median, over a sparse grid, of each pixel's distance to the mean
     * of its 3x3 neighbourhood. Flat paper and solid blacks dominate a page, so the median measures their grain, not
     * the edges of the drawing. A page property: inside one region, art behind a sound effect is no evidence of
     * noisy paper.
     */
    static boolean noisyScan(BufferedImage image) {
        int width = image.getWidth(), height = image.getHeight();
        var histogram = new int[256 * 3 + 1];
        int count = 0;
        for (int y = 1; y < height - 1; y += NOISE_STEP) {
            CleanBoxPainter.checkInterrupted();
            for (int x = 1; x < width - 1; x += NOISE_STEP) {
                int r = 0, g = 0, b = 0;
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                    int p = image.getRGB(x + dx, y + dy);
                    r += (p >>> 16) & 255; g += (p >>> 8) & 255; b += p & 255;
                }
                int c = image.getRGB(x, y);
                int deviation = (Math.abs(9 * ((c >>> 16) & 255) - r) + Math.abs(9 * ((c >>> 8) & 255) - g)
                    + Math.abs(9 * (c & 255) - b)) / 9;
                histogram[Math.min(deviation, histogram.length - 1)]++;
                count++;
            }
        }
        if (count == 0) return false;
        int median = 0;
        for (int seen = 0; median < histogram.length; median++) if ((seen += histogram[median]) * 2 >= count) break;
        return median >= NOISY_SCAN;
    }

    /** Paper noise this many times the typical distance of the paper still counts as the same flat background. */
    static final double NOISE_FACTOR = 2;
    /** Widest flat tolerance: well under the ink threshold, so lettering and line art never pass for paper. */
    static final int MAX_BACKGROUND_DISTANCE = 75;

    /**
     * Distance to the balloon colour up to which a pixel is flat background on a noisy scan page. Clean digital paper
     * sits within a few units of it and keeps {@link CleanBoxPainter#BACKGROUND_DISTANCE}; an old printed scan (halftone, JPEG noise,
     * yellowed paper) spreads its paper far wider, and a fixed bound sees two thirds of it as art and finds no room
     * for text. The bound follows the median distance of the non-ink pixels inside the polygon (the paper between the
     * letters), within {@link #MAX_BACKGROUND_DISTANCE}.
     */
    static int flatTolerance(int[] distances, boolean[] inside, boolean[] ink) {
        int[] histogram = new int[CleanBoxPainter.INK_DISTANCE + 1];
        int count = 0;
        for (int i = 0; i < distances.length; i++) if (inside[i] && !ink[i]) { histogram[distances[i]]++; count++; }
        if (count == 0) return CleanBoxPainter.BACKGROUND_DISTANCE;
        int median = 0;
        for (int seen = 0; median < histogram.length; median++) if ((seen += histogram[median]) * 2 >= count) break;
        return Math.clamp(Math.round(NOISE_FACTOR * median), CleanBoxPainter.BACKGROUND_DISTANCE, MAX_BACKGROUND_DISTANCE);
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

    /** Farthest an edge sample may be from the region's colour (sum of channel differences) and still be background. */
    static final int BACKGROUND_SAMPLE = 90;
    private static final int SAMPLE_PX = 3;

    /**
     * Paints the clean pixels. Each clean run of a row goes from the background just left of it to the background just
     * right of it, so a gradient (a cover, a tinted page) gets no flat patch. A side whose neighbour is not background
     * (balloon border, art) takes the other side's colour; with neither, the region's own colour, as a flat fill.
     */
    void fill(BufferedImage image, int argb) {
        for (int y = 0; y < height; y++) {
            CleanBoxPainter.checkInterrupted();
            int x = 0;
            while (x < width) {
                if ((state[y * width + x] & CLEAN) == 0) { x++; continue; }
                int start = x;
                while (x < width && (state[y * width + x] & CLEAN) != 0) x++;
                int from = sample(image, left + start - 1, top + y, -1, argb), to = sample(image, left + x, top + y, 1, argb);
                if (from == 0 && to == 0) from = to = argb;
                else if (from == 0) from = to;
                else if (to == 0) to = from;
                int span = x - start;
                for (int k = 0; k < span; k++) image.setRGB(left + start + k, top + y, mix(from, to, span == 1 ? 0 : k / (double) (span - 1)));
            }
        }
    }

    /** Mean of a few pixels outward from ({@code x},{@code y}), or 0 when any of them is not background. */
    private static int sample(BufferedImage image, int x, int y, int step, int argb) {
        int r = 0, g = 0, b = 0, n = 0;
        for (int k = 0; k < SAMPLE_PX; k++, x += step) {
            if (x < 0 || x >= image.getWidth() || y < 0 || y >= image.getHeight()) break;
            int pixel = image.getRGB(x, y);
            if (CleanBoxPainter.distance(pixel, argb) > BACKGROUND_SAMPLE) return 0;
            r += (pixel >>> 16) & 255; g += (pixel >>> 8) & 255; b += pixel & 255; n++;
        }
        return n == 0 ? 0 : 0xff000000 | (r / n) << 16 | (g / n) << 8 | (b / n);
    }

    private static int mix(int a, int b, double t) {
        int r = (int) Math.round(((a >>> 16) & 255) * (1 - t) + ((b >>> 16) & 255) * t);
        int g = (int) Math.round(((a >>> 8) & 255) * (1 - t) + ((b >>> 8) & 255) * t);
        int bl = (int) Math.round((a & 255) * (1 - t) + (b & 255) * t);
        return 0xff000000 | r << 16 | g << 8 | bl;
    }

    /** Shrinks {@code box} edge by edge, dropping the edge with most forbidden pixels, until every pixel is allowed. */
    RasterPolygon.Bounds fit(RasterPolygon.Bounds box) { return fit(box, true); }

    /**
     * Like {@link #fit}, also using the room of completed edge letters and their halos ({@link #markDarkGlyphs}). Their
     * islands can mislead the edge-by-edge shrink, so callers compose in both boxes and keep the better text.
     */
    RasterPolygon.Bounds fitCompleted(RasterPolygon.Bounds box) { return fit(box, false); }

    private boolean allowed(int x, int y, boolean strict) {
        if (x < left || y < top || x >= left + width || y >= top + height) return false;
        int value = state[(y - top) * width + x - left];
        return (value & ALLOWED) != 0 && (!strict || (value & (HALO | DARK)) == 0);
    }

    private RasterPolygon.Bounds fit(RasterPolygon.Bounds box, boolean strict) {
        int l = box.left(), t = box.top(), r = box.right(), b = box.bottom();
        while (l < r && t < b) {
            CleanBoxPainter.checkInterrupted();
            int leftBad = 0, rightBad = 0, topBad = 0, bottomBad = 0;
            for (int y = t; y < b; y++) { if (!allowed(l, y, strict)) leftBad++; if (!allowed(r - 1, y, strict)) rightBad++; }
            for (int x = l; x < r; x++) { if (!allowed(x, t, strict)) topBad++; if (!allowed(x, b - 1, strict)) bottomBad++; }
            int worst = Math.max(Math.max(leftBad, rightBad), Math.max(topBad, bottomBad));
            if (worst == 0) {
                // Edges are clean; interior forbidden pixels (art islands) still shrink the box from the nearest side.
                int bad = firstForbiddenRow(l, t, r, b, strict);
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

    private int firstForbiddenRow(int l, int t, int r, int b, boolean strict) {
        for (int y = t; y < b; y++) for (int x = l; x < r; x++) if (!allowed(x, y, strict)) return y;
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

    /**
     * Non-balloon pixels reachable from the window edge are outside the balloon (its border, the art around it). On a
     * noisy scan ({@code narrow}), the walk does not squeeze through necks of 1-2 px between balloon pixels: the
     * grain of the paper ties a letter set close to the border to that border, and the letter would pass for art.
     * The pixels bordering what was reached are added back, so the border itself stays outside whole.
     */
    private static void markOutside(byte[] state, int width, int height, boolean narrow) {
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
                if ((state[n] & (BALLOON | OUTSIDE)) != 0 || narrow && nearBalloon(state, width, height, nx, ny)) continue;
                state[n] |= OUTSIDE; queue[tail++] = n;
            }
            if ((head & 0xffff) == 0) CleanBoxPainter.checkInterrupted();
        }
        if (!narrow) return;
        var ring = new java.util.ArrayList<Integer>();
        for (int k = 0; k < tail; k++) {
            int i = queue[k], x = i % width, y = i / width;
            for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                int nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                int n = ny * width + nx;
                if ((state[n] & (BALLOON | OUTSIDE)) == 0) ring.add(n);
            }
        }
        for (int n : ring) state[n] |= OUTSIDE;
    }

    /** A balloon pixel among the 8 neighbours: ({@code x},{@code y}) lies in a neck, not in open art. */
    private static boolean nearBalloon(byte[] state, int width, int height, int x, int y) {
        for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
            int nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < width && ny < height && (state[ny * width + nx] & BALLOON) != 0) return true;
        }
        return false;
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

    /** Share of the recognised letters' ink a colour needs to be part of the lettering's palette. */
    static final double LETTERING_COLOUR_SHARE = .03;
    /** Share of the surrounding art's ink from which a colour belongs to the art (generous: art is what we keep). */
    static final double ART_COLOUR_SHARE = .005;
    /** Fewest recognised letter pixels to learn a palette from. */
    static final int MIN_LETTERING_PIXELS = 200;
    private static final int COLOUR_BIN = 16;

    /**
     * Letters tied to the art by contact (a word of the lettering crossing the balloon's border): ink inside the
     * polygon that reaches the window edge, so the blob test sees it as art. When the region's recognised letters have
     * colours of their own (a coloured fill, a stroke) that the art around never uses, such ink inside the polygon in
     * those colours is lettering too. Black text touching black art shares the art's palette and stays as it is.
     */
    private static void markLetteringColours(byte[] state, boolean[] inside, boolean[] ink, int[] colours, int width, int height) {
        var lettering = new java.util.HashMap<Integer, Integer>();
        var art = new java.util.HashMap<Integer, Integer>();
        int letters = 0, artPixels = 0;
        for (int i = 0; i < state.length; i++) {
            if (!ink[i]) continue;
            if (inside[i] && (state[i] & GLYPH) != 0) { lettering.merge(bin(colours[i]), 1, Integer::sum); letters++; }
            else if (!inside[i] && (state[i] & OUTSIDE) != 0) { art.merge(bin(colours[i]), 1, Integer::sum); artPixels++; }
        }
        // Both palettes must be known: without art around there is nothing the letters could be told apart from.
        if (letters < MIN_LETTERING_PIXELS || artPixels < MIN_LETTERING_PIXELS) return;
        var palette = new java.util.HashSet<Integer>();
        for (var entry : lettering.entrySet()) if (entry.getValue() >= LETTERING_COLOUR_SHARE * letters) palette.add(entry.getKey());
        var artPalette = new java.util.HashSet<Integer>();
        for (var entry : art.entrySet()) if (entry.getValue() >= ART_COLOUR_SHARE * artPixels) artPalette.add(entry.getKey());
        palette.removeIf(colour -> near(colour, artPalette));
        if (palette.isEmpty()) return;
        var found = new java.util.ArrayList<Integer>();
        for (int i = 0; i < state.length; i++) {
            if (!inside[i] || !ink[i] || (state[i] & GLYPH) != 0 || (state[i] & OUTSIDE) == 0) continue;
            int colour = bin(colours[i]);
            if (palette.contains(colour) && !near(colour, artPalette)) { state[i] |= GLYPH; found.add(i); }
        }
        // Their antialiased fringe (shades between fill, stroke and paper) goes with them; the art's colours never do.
        for (int i : found) {
            int x = i % width, y = i / width;
            for (int dy = -LETTERING_FRINGE_PX; dy <= LETTERING_FRINGE_PX; dy++) for (int dx = -LETTERING_FRINGE_PX; dx <= LETTERING_FRINGE_PX; dx++) {
                int nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                int n = ny * width + nx;
                if (inside[n] && (state[n] & (GLYPH | BALLOON)) == 0 && (!ink[n] || !near(bin(colours[n]), artPalette)))
                    state[n] |= GLYPH;
            }
        }
    }

    private static final int LETTERING_FRINGE_PX = 2;

    private static int bin(int rgb) {
        return ((rgb >>> 16) & 255) / COLOUR_BIN << 8 | ((rgb >>> 8) & 255) / COLOUR_BIN << 4 | (rgb & 255) / COLOUR_BIN;
    }

    /** Within one bin on every channel of a colour of {@code palette}. */
    private static boolean near(int colour, java.util.Set<Integer> palette) {
        int r = colour >> 8, g = (colour >> 4) & 15, b = colour & 15;
        for (int dr = -1; dr <= 1; dr++) for (int dg = -1; dg <= 1; dg++) for (int db = -1; db <= 1; db++) {
            int nr = r + dr, ng = g + dg, nb = b + db;
            if (nr >= 0 && ng >= 0 && nb >= 0 && nr < 16 && ng < 16 && nb < 16 && palette.contains(nr << 8 | ng << 4 | nb)) return true;
        }
        return false;
    }

    /**
     * Enclosed share of the polygon's ink from which edge letters are completed ({@link #markDarkGlyphs}): text already
     * seen mostly on a plain box (a caption whose edge letters escape, ~0.9), not a half-drawn interface button (~0.5).
     */
    static final double MIN_ENCLOSED_FOR_DARK_GLYPHS = .75;

    private static double enclosedShare(byte[] state, boolean[] inside, boolean[] ink) {
        int inkInside = 0, enclosed = 0;
        for (int i = 0; i < state.length; i++) if (inside[i] && ink[i]) { inkInside++; if ((state[i] & GLYPH) != 0) enclosed++; }
        return inkInside == 0 ? 1 : (double) enclosed / inkInside;
    }

    /** Share of a dark blob's pixels inside the polygon from which it is lettering, not artwork touching the box. */
    static final double MIN_DARK_GLYPH_INSIDE = .6;
    /** Light halo cleaned around such a glyph, as a share of its height (outlined or glowing lettering). */
    static final double HALO_SHARE = .25;
    static final int MAX_HALO_PX = 16;

    /**
     * Lettering a light outline or glow connects to the window edge ("TIME FOR…" with a white stroke on a gradient,
     * a caption with a glow): the blob test above sees it as artwork and leaves the whole letter. Judged by its dark ink
     * alone it is a glyph — a dark blob mostly inside the polygon that does not reach the window edge through dark ink
     * (balloon borders and art lines do). Its light halo, up to a quarter of its height, is cleaned with it; dark pixels
     * never join the halo, so a border next to the text stays.
     */
    private static void markDarkGlyphs(byte[] state, boolean[] inside, boolean[] ink, int width, int height) {
        var seen = new boolean[state.length];
        var queue = new int[state.length];
        var distance = new int[state.length];
        for (int start = 0; start < state.length; start++) {
            if (seen[start] || !ink[start] || (state[start] & (GLYPH | BALLOON)) != 0) continue;
            int head = 0, tail = 0, insideCount = 0, minY = height, maxY = 0;
            boolean edge = false;
            seen[start] = true; queue[tail++] = start;
            while (head < tail) {
                int i = queue[head++], x = i % width, y = i / width;
                if (inside[i]) insideCount++;
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                edge |= x == 0 || y == 0 || x == width - 1 || y == height - 1;
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                    int nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                    int n = ny * width + nx;
                    if (seen[n] || !ink[n] || (state[n] & BALLOON) != 0) continue;
                    seen[n] = true; queue[tail++] = n;
                }
            }
            CleanBoxPainter.checkInterrupted();
            if (edge || insideCount < MIN_DARK_GLYPH_INSIDE * tail) continue;
            int radius = Math.clamp(Math.round((maxY - minY + 1) * HALO_SHARE), 2, MAX_HALO_PX);
            // The blob, then its light halo by breadth-first distance (8-connected), never through dark ink or balloon.
            int halo = tail;
            for (int k = 0; k < tail; k++) { state[queue[k]] |= GLYPH | DARK; distance[queue[k]] = 0; }
            head = 0;
            while (head < halo) {
                int i = queue[head++], x = i % width, y = i / width;
                if (distance[i] >= radius) continue;
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                    int nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                    int n = ny * width + nx;
                    if (ink[n] || (state[n] & (GLYPH | BALLOON | HALO)) != 0) continue;
                    state[n] |= HALO; distance[n] = distance[i] + 1; queue[halo++] = n;
                }
            }
        }
    }

    private static boolean insideAny(List<RasterPolygon> polygons, int x, int y) {
        for (var polygon : polygons) if (polygon.contains(x, y)) return true;
        return false;
    }
}
