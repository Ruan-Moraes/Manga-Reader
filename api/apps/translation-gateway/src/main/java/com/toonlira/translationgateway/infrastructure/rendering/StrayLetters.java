package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.function.IntBinaryOperator;

/**
 * Letters a flat clean left behind next to the ones it erased. The balloon mask keeps every ink blob that reaches past
 * its window or touches art through antialiasing, which is right for borders and drawings but also keeps a glyph whose
 * stroke runs a little out of the OCR box (a brush-lettered title, a tail that crosses the box edge): half a word is
 * erased and the rest stays beside the translation.
 *
 * <p>A blob still there after the clean is such a letter when it is glyph-sized (each side at most
 * {@link #MAX_GLYPH_SPAN} times the source letter pitch), lies almost wholly inside the region's polygon
 * ({@link #MIN_INSIDE}) and has the tone of the ink that was erased ({@link #MIN_TONE}). Art the box overlaps fails at
 * least one of them: it is bigger, crosses the box, or has another tone (a grey disc, a screentone, a coloured border).
 */
final class StrayLetters {
    static final double MAX_GLYPH_SPAN = 1.5, MIN_INSIDE = .9, MIN_TONE = .8;
    /** Blobs smaller than this are noise the halo pass deals with. */
    static final int MIN_PIXELS = 20;
    /** Antialiased edge around a stray letter, erased with it. */
    static final int FRINGE_PX = 2;

    private StrayLetters() { }

    /**
     * Erases (with the region's balloon colour) the source letters the clean left behind; {@code before(x, y)} is the
     * pixel as it was before the clean. Returns how many letters were erased.
     */
    static int erase(BufferedImage image, CleanBoxPainter.CleanRegion region, IntBinaryOperator before) {
        var bounds = region.polygon().bounds();
        int span = reach(region);
        if (span == 0) return 0;
        // Search area: the polygon's box and one glyph around it, so a letter crossing the box edge is seen whole.
        int left = Math.max(0, bounds.left() - span), top = Math.max(0, bounds.top() - span);
        int right = Math.min(image.getWidth(), bounds.right() + span), bottom = Math.min(image.getHeight(), bounds.bottom() + span);
        int width = right - left, height = bottom - top;
        if (width <= 0 || height <= 0) return 0;
        int argb = region.argb();
        var ink = new boolean[width * height];
        long erasedTone = 0, erasedCount = 0;
        for (int y = 0; y < height; y++) {
            CleanBoxPainter.checkInterrupted();
            for (int x = 0; x < width; x++) {
                int now = image.getRGB(left + x, top + y), was = before.applyAsInt(left + x, top + y);
                int distance = CleanBoxPainter.distance(was, argb);
                if (now == was) ink[y * width + x] = distance > CleanBoxPainter.INK_DISTANCE;
                // Tone of the erased letters: the source ink the clean changed.
                else if (distance > CleanBoxPainter.INK_DISTANCE) { erasedTone += distance; erasedCount++; }
            }
        }
        if (erasedCount == 0) return 0;
        double tone = (double) erasedTone / erasedCount;
        var seen = new boolean[width * height];
        int found = 0;
        for (int start = 0; start < ink.length; start++) {
            if (!ink[start] || seen[start]) continue;
            var blob = new ArrayList<Integer>();
            var queue = new ArrayDeque<Integer>();
            queue.add(start);
            seen[start] = true;
            int l = width, t = height, r = -1, b = -1, inside = 0;
            long blobTone = 0;
            boolean edge = false;
            while (!queue.isEmpty()) {
                int i = queue.poll(), x = i % width, y = i / width;
                blob.add(i);
                l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
                if (region.polygon().contains(left + x, top + y)) inside++;
                blobTone += CleanBoxPainter.distance(image.getRGB(left + x, top + y), argb);
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                    int nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) { edge = true; continue; }
                    int n = ny * width + nx;
                    if (ink[n] && !seen[n]) { seen[n] = true; queue.add(n); }
                }
            }
            if (edge || blob.size() < MIN_PIXELS || inside < MIN_INSIDE * blob.size()) continue;
            if (r - l + 1 > span || b - t + 1 > span) continue;
            if ((double) blobTone / blob.size() < MIN_TONE * tone) continue;
            fill(image, argb, ink, blob, left, top, width, height);
            found++;
        }
        return found;
    }

    /** How far around the polygon's box a stray letter is looked for: its largest glyph size (0 without letters). */
    static int reach(CleanBoxPainter.CleanRegion region) {
        var bounds = region.polygon().bounds();
        long letters = region.region().sourceText().codePoints().filter(Character::isLetterOrDigit).count();
        if (letters == 0) return 0;
        double pitch = Math.sqrt((double) (bounds.right() - bounds.left()) * (bounds.bottom() - bounds.top()) / letters);
        return (int) Math.ceil(MAX_GLYPH_SPAN * pitch);
    }

    /**
     * Fills the letter and its antialiased edge with the colour of the paper right around it (median of a ring just
     * past the edge, other ink left out), so a letter on a gradient or aged paper leaves no flat patch.
     */
    private static void fill(BufferedImage image, int argb, boolean[] ink, java.util.List<Integer> blob,
                             int left, int top, int width, int height) {
        var reach = new int[width * height];
        java.util.Arrays.fill(reach, Integer.MAX_VALUE);
        int ringEnd = FRINGE_PX + RING_PX;
        for (int i : blob) {
            int x = i % width, y = i / width;
            for (int dy = -ringEnd; dy <= ringEnd; dy++) for (int dx = -ringEnd; dx <= ringEnd; dx++) {
                int nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                int n = ny * width + nx;
                reach[n] = Math.min(reach[n], Math.max(Math.abs(dx), Math.abs(dy)));
            }
        }
        var ring = new ArrayList<Integer>();
        for (int n = 0; n < reach.length; n++)
            if (reach[n] > FRINGE_PX && reach[n] <= ringEnd && !ink[n]) ring.add(image.getRGB(left + n % width, top + n / width));
        int paper = ring.isEmpty() ? argb : median(ring);
        for (int n = 0; n < reach.length; n++) {
            if (reach[n] > FRINGE_PX) continue;
            // The letter itself, and only its own edge around it: other ink and paper already close to the fill stay.
            boolean letter = reach[n] == 0;
            if (!letter && (ink[n] || CleanBoxPainter.distance(image.getRGB(left + n % width, top + n / width), paper)
                <= CleanBoxPainter.BACKGROUND_DISTANCE)) continue;
            image.setRGB(left + n % width, top + n / width, paper);
        }
    }

    /** Width of the ring past the letter's edge whose colour fills it. */
    static final int RING_PX = 3;

    private static int median(java.util.List<Integer> colours) {
        int result = 0xff000000;
        for (int shift : new int[]{16, 8, 0}) {
            int[] channel = colours.stream().mapToInt(c -> (c >>> shift) & 255).sorted().toArray();
            result |= channel[channel.length / 2] << shift;
        }
        return result;
    }
}
