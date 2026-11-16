package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.RenderingHints;
import java.awt.image.BufferedImage;

/**
 * The pure-Java half of inpainting, shared by the in-process painter and the isolated child: a square window around
 * the box (at least {@link #CONTEXT}x the box, for context) resized to the model's fixed {@link #SIZE}, and the way
 * the model's answer is written back. No native code: the isolated child prepares and applies windows, only the
 * model ({@link InpaintModel}) runs elsewhere.
 *
 * @param rgb  {@code SIZE*SIZE*3} bytes, planar R, G, B
 * @param mask {@code SIZE*SIZE} bytes, 1 where the model must rebuild
 */
record InpaintWindow(int wx, int wy, int side, int left, int top, int right, int bottom, byte[] rgb, byte[] mask,
                     byte[] shape, int[] paste) {
    static final int SIZE = 512;
    static final int RGB_BYTES = 3 * SIZE * SIZE, MASK_BYTES = SIZE * SIZE;
    private static final double CONTEXT = 2.5;
    /** Sum of channel differences above which the model really changed a pixel (not resampling noise). */
    static final int CHANGED = 60;
    static final int FEATHER = 2;
    /** Outline room around the box: this share of its letters' height ({@link #letterHeight}), at most {@link #MAX_GROW} px. */
    static final double GROW_SHARE = .3;
    static final int MAX_GROW = 32;
    /**
     * Farthest a pixel may be from the lettering's light outline colour to be that outline: the mask grows through
     * these only, and they are always replaced, however small the change. A pale background a little further away
     * (white glow on cream paper) is not followed: masked wholesale, it leaves the model no context and it invents.
     */
    static final int OUTLINE_CORE = 30;
    static final byte IN_SHAPE = 1, OUTLINE = 2;

    /**
     * The window for {@code box} = {left, top, right, bottom}, or null when the box does not fit the page. The mask
     * has the lettering's shape: the box, plus the light outline or glow of its letters where it spills out of the
     * box (pixels of the outline colour connected to the box, within {@link #GROW_SHARE} of its size). Left out of
     * the mask, that outline is context the model reads as letters and rebuilds as a blurred ghost of the original.
     * Dark pixels never join (line art next to the lettering stays as drawn). The placement depends only on the box,
     * so a replay with already painted neighbours keeps the same geometry.
     */
    static InpaintWindow prepare(BufferedImage image, int[] box) { return prepare(image, box, 0); }

    /** Model input scaled down at most this much; a longer lettering is rebuilt in {@link #pieces} instead. */
    static final double MAX_DOWNSCALE = 4;
    static final int MAX_PIECES = 4;

    /**
     * Windows a lettering is rebuilt in, one after the other: one, or up to {@link #MAX_PIECES} along its longer side
     * when one window holding it (with context) would shrink it more than {@link #MAX_DOWNSCALE} (a title line 1500
     * px wide went to the model 5x smaller, too coarse to rebuild the art behind it). Depends only on the box and the
     * page size, so both passes of the isolated renderer ask for the same windows.
     */
    static int pieces(BufferedImage image, int[] box) {
        int length = Math.max(box[2] - box[0], box[3] - box[1]);
        double needed = CONTEXT * length / (MAX_DOWNSCALE * SIZE);
        return Math.clamp((int) Math.ceil(needed), 1, MAX_PIECES);
    }

    /**
     * Window {@code piece} of {@link #pieces}: centred on that part of the lettering, masking all of the lettering it
     * holds (a neighbour piece left visible is read as letters to complete), and writing back that part only.
     */
    static InpaintWindow prepare(BufferedImage image, int[] box, int piece) { return prepare(image, image, box, piece); }

    /**
     * {@code original}: the page before any piece was written, the only source of the lettering's shape (once the
     * first pieces are clean, the outline colour of what is left differs and the rest of the outline would be
     * missed); {@code pixels}: the page the model sees, with the pieces already rebuilt.
     */
    static InpaintWindow prepare(BufferedImage original, BufferedImage pixels, int[] box, int piece) {
        var image = original;
        int boxLeft = Math.max(0, box[0]), boxTop = Math.max(0, box[1]);
        int boxRight = Math.min(image.getWidth(), box[2]), boxBottom = Math.min(image.getHeight(), box[3]);
        if (boxRight <= boxLeft || boxBottom <= boxTop) return null;
        int grow = Math.min(MAX_GROW, (int) Math.round(GROW_SHARE * letterHeight(image, boxLeft, boxTop, boxRight, boxBottom)));
        int left = Math.max(0, boxLeft - grow), top = Math.max(0, boxTop - grow);
        int right = Math.min(image.getWidth(), boxRight + grow), bottom = Math.min(image.getHeight(), boxBottom + grow);
        if (right <= left || bottom <= top) return null;
        int count = pieces(image, box);
        if (piece < 0 || piece >= count) return null;
        // The written part: a slice of the grown box along its longer side.
        boolean across = right - left >= bottom - top;
        int length = across ? right - left : bottom - top, from = (across ? left : top) + length * piece / count;
        int to = (across ? left : top) + length * (piece + 1) / count;
        int[] paste = across ? new int[]{from, top, to, bottom} : new int[]{left, from, right, to};
        int side = Math.min(Math.min(image.getWidth(), image.getHeight()),
            Math.max(SIZE, (int) Math.ceil(CONTEXT * Math.max(paste[2] - paste[0], paste[3] - paste[1]))));
        if (paste[2] - paste[0] > side || paste[3] - paste[1] > side) return null;
        int wx = Math.clamp((paste[0] + paste[2]) / 2 - side / 2, 0, image.getWidth() - side);
        int wy = Math.clamp((paste[1] + paste[3]) / 2 - side / 2, 0, image.getHeight() - side);
        var shape = shape(image, left, top, right, bottom, boxLeft, boxTop, boxRight, boxBottom);
        dilate(shape, right - left, bottom - top, Math.max(1, grow / EDGE_SHARE));
        fillToRectangle(shape, right - left, bottom - top, boxLeft - left, boxTop - top, boxRight - left, boxBottom - top);
        var input = resize(pixels.getSubimage(wx, wy, side, side), SIZE);
        var rgb = new byte[RGB_BYTES];
        var mask = new byte[MASK_BYTES];
        double scale = (double) SIZE / side;
        for (int y = 0; y < SIZE; y++) for (int x = 0; x < SIZE; x++) {
            int pixel = input.getRGB(x, y), i = y * SIZE + x;
            rgb[i] = (byte) (pixel >> 16);
            rgb[MASK_BYTES + i] = (byte) (pixel >> 8);
            rgb[2 * MASK_BYTES + i] = (byte) pixel;
            double px = wx + (x + .5) / scale, py = wy + (y + .5) / scale;
            mask[i] = (byte) (masked(shape, left, top, right, bottom, px, py) ? 1 : 0);
        }
        return new InpaintWindow(wx, wy, side, left, top, right, bottom, rgb, mask, shape, paste);
    }

    /**
     * Typical thickness of the outline: the median, over the ink's edge pixels inside the box, of the run of outline
     * colour going straight out of the ink (left, right, up or down), counting only edges that have one. The mask
     * follows the outline beyond the box no further than that: a stroked title's 13 px rim, not the white belly of a
     * mascot drawn half inside a credits block wrapped in a 2 px glow.
     */
    static int outlineThickness(BufferedImage image, int boxLeft, int boxTop, int boxRight, int boxBottom, int outline) {
        var runs = new java.util.ArrayList<Integer>();
        int[][] directions = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int y = boxTop; y < boxBottom; y++) for (int x = boxLeft; x < boxRight; x++) {
            if (luma(image.getRGB(x, y)) >= INK_LUMA) continue;
            for (var d : directions) {
                int nx = x + d[0], ny = y + d[1];
                if (nx < boxLeft || ny < boxTop || nx >= boxRight || ny >= boxBottom || luma(image.getRGB(nx, ny)) < INK_LUMA) continue;
                int run = 0, gap = 0;
                for (int k = 1; k <= MAX_GROW; k++) {
                    int px = x + k * d[0], py = y + k * d[1];
                    if (px < 0 || py < 0 || px >= image.getWidth() || py >= image.getHeight()) break;
                    if (core(image.getRGB(px, py), outline)) { run = k; gap = 0; }
                    else if (run > 0 || ++gap > EDGE_GAP) break;   // antialiasing between ink and outline
                    else continue;
                    if (run > 0 && !core(image.getRGB(px, py), outline)) break;
                }
                if (run > 0) runs.add(run);
            }
        }
        if (runs.isEmpty()) return 0;
        runs.sort(null);
        return runs.get(runs.size() / 2);
    }

    /** Antialiased pixels allowed between the ink and its outline. */
    private static final int EDGE_GAP = 2;

    /** Luminance under which a pixel is ink of the lettering. */
    static final int INK_LUMA = 110;

    /**
     * Height of the box's lettering: the median height of its bands of rows holding ink (one band per text line).
     * An outline's thickness follows the letters, not the box: a credits block of five small lines gets the room of
     * small letters (and does not reach into the art above it), a one-line title that of its big ones. The box's
     * shorter side when no ink band is found.
     */
    static int letterHeight(BufferedImage image, int boxLeft, int boxTop, int boxRight, int boxBottom) {
        int width = boxRight - boxLeft, minimum = Math.max(1, width / 100);
        var bands = new java.util.ArrayList<Integer>();
        int run = 0;
        for (int y = boxTop; y < boxBottom; y++) {
            int ink = 0;
            for (int x = boxLeft; x < boxRight; x++) if (luma(image.getRGB(x, y)) < INK_LUMA) ink++;
            if (ink >= minimum) run++;
            else if (run > 0) { bands.add(run); run = 0; }
        }
        if (run > 0) bands.add(run);
        if (bands.isEmpty()) return Math.min(width, boxBottom - boxTop);
        bands.sort(null);
        return bands.get(bands.size() / 2);
    }

    /** The outline's antialiased edge (blending into dark art) as a share of the grow room: 1/4. */
    static final int EDGE_SHARE = 4;

    /**
     * Widens the shape by {@code radius} px: where an outline fades into the art its last pixels are too far from
     * the outline colour to join, and left visible they draw the letters' contour for the model to complete. The
     * widened ring is written back only where the model really changed it.
     */
    private static void dilate(byte[] shape, int width, int height, int radius) {
        var row = new byte[shape.length];
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int i = y * width + x;
            if (shape[i] != 0) { row[i] = shape[i]; continue; }
            for (int dx = -radius; dx <= radius && row[i] == 0; dx++) {
                int nx = x + dx;
                if (nx >= 0 && nx < width && shape[y * width + nx] != 0) row[i] = IN_SHAPE;
            }
        }
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int i = y * width + x;
            if (shape[i] != 0) continue;
            for (int dy = -radius; dy <= radius; dy++) {
                int ny = y + dy;
                if (ny >= 0 && ny < height && row[ny * width + x] != 0) { shape[i] = IN_SHAPE; break; }
            }
        }
    }

    /**
     * The hole the model fills is a rectangle around the lettering and its outline, not their silhouette: the model
     * carries a hole's edges inward, and an outline-shaped hole came back as pale strokes where the letters were.
     * Each side reaches the outline's typical thickness there (median over the box's columns or rows), so a light
     * patch of the art the outline happens to touch at a few places does not stretch it over that art. The pixels
     * added are written back only where the model really changed them.
     */
    private static void fillToRectangle(byte[] shape, int width, int height, int boxLeft, int boxTop, int boxRight, int boxBottom) {
        int up = medianReach(shape, width, height, boxLeft, boxRight, boxTop - 1, -1, true);
        int down = medianReach(shape, width, height, boxLeft, boxRight, boxBottom, 1, true);
        int before = medianReach(shape, width, height, boxTop, boxBottom, boxLeft - 1, -1, false);
        int after = medianReach(shape, width, height, boxTop, boxBottom, boxRight, 1, false);
        int l = Math.max(0, boxLeft - before), r = Math.min(width, boxRight + after);
        int t = Math.max(0, boxTop - up), b = Math.min(height, boxBottom + down);
        for (int y = t; y < b; y++) for (int x = l; x < r; x++) if (shape[y * width + x] == 0) shape[y * width + x] = IN_SHAPE;
    }

    /**
     * Median, over the lines {@code from..to} (columns when {@code vertical}), of how far the shape runs unbroken
     * from {@code start} in direction {@code step}.
     */
    private static int medianReach(byte[] shape, int width, int height, int from, int to, int start, int step, boolean vertical) {
        if (to <= from) return 0;
        var reach = new int[to - from];
        for (int line = from; line < to; line++) {
            int n = 0;
            for (int at = start; vertical ? at >= 0 && at < height : at >= 0 && at < width; at += step) {
                int i = vertical ? at * width + line : line * width + at;
                if (shape[i] == 0) break;
                n++;
            }
            reach[line - from] = n;
        }
        java.util.Arrays.sort(reach);
        return reach[reach.length * 3 / 4];
    }

    /** Whether a window sample at page position ({@code px},{@code py}) falls on (or within 1 px of) the shape. */
    private static boolean masked(byte[] shape, int left, int top, int right, int bottom, double px, double py) {
        int width = right - left;
        for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
            int x = (int) Math.floor(px) + dx, y = (int) Math.floor(py) + dy;
            if (x >= left && x < right && y >= top && y < bottom && shape[(y - top) * width + x - left] != 0) return true;
        }
        return false;
    }

    /** The box, grown through pixels of the outline colour connected to it (see {@link #prepare}). */
    static byte[] shape(BufferedImage image, int left, int top, int right, int bottom,
                           int boxLeft, int boxTop, int boxRight, int boxBottom) {
        int width = right - left, height = bottom - top;
        var shape = new byte[width * height];
        var queue = new int[width * height];
        int tail = 0;
        int outline = outlineColour(image, boxLeft, boxTop, boxRight, boxBottom);
        // An outline only stands out from a background of another colour (a white glow on a tinted cover). Where the
        // surroundings are that same colour (dark letters on white paper) there is no outline to follow: the light
        // pixels are the paper, and the mask stays the box.
        int around = bandColour(image, left, top, right, bottom, boxLeft, boxTop, boxRight, boxBottom);
        if (outline != 0 && CleanBoxPainter.distance(around, outline) <= OUTLINE_CORE) outline = 0;
        for (int y = boxTop; y < boxBottom; y++) for (int x = boxLeft; x < boxRight; x++) {
            int i = (y - top) * width + x - left;
            shape[i] = core(image.getRGB(x, y), outline) ? OUTLINE : IN_SHAPE;
            if (x == boxLeft || y == boxTop || x == boxRight - 1 || y == boxBottom - 1) queue[tail++] = i;
        }
        if (outline == 0) return shape;
        int reach = outlineThickness(image, boxLeft, boxTop, boxRight, boxBottom, outline);
        var depth = new int[width * height];
        for (int head = 0; head < tail; head++) {
            CleanBoxPainter.checkInterrupted();
            int i = queue[head], x = i % width, y = i / width;
            for (int k = 0; k < 4; k++) {
                int nx = x + (k == 0 ? 1 : k == 1 ? -1 : 0), ny = y + (k == 2 ? 1 : k == 3 ? -1 : 0);
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                int n = ny * width + nx;
                int pixel = image.getRGB(left + nx, top + ny);
                if (shape[n] != 0 || !core(pixel, outline) || depth[i] + 1 > reach) continue;
                depth[n] = depth[i] + 1;
                shape[n] = OUTLINE;
                queue[tail++] = n;
            }
        }
        return shape;
    }

    /** Median colour of the band between the box and the grown rectangle: the background around the lettering. */
    private static int bandColour(BufferedImage image, int left, int top, int right, int bottom,
                                  int boxLeft, int boxTop, int boxRight, int boxBottom) {
        var r = new int[256]; var g = new int[256]; var b = new int[256];
        int count = 0;
        for (int y = top; y < bottom; y++) for (int x = left; x < right; x++) {
            if (x >= boxLeft && x < boxRight && y >= boxTop && y < boxBottom) continue;
            int p = image.getRGB(x, y);
            r[(p >>> 16) & 255]++; g[(p >>> 8) & 255]++; b[p & 255]++; count++;
        }
        return count == 0 ? 0 : 0xff000000 | median(r, count) << 16 | median(g, count) << 8 | median(b, count);
    }

    private static boolean core(int pixel, int outline) {
        return outline != 0 && CleanBoxPainter.distance(pixel, outline) <= OUTLINE_CORE;
    }

    /**
     * The lettering's light outline colour: the median of the brightest tenth of the box's pixels (white or tinted
     * glow around dark letters), or 0 when that is not light at all (lettering without a light outline).
     */
    private static int outlineColour(BufferedImage image, int boxLeft, int boxTop, int boxRight, int boxBottom) {
        var luminance = new int[256];
        int count = 0;
        for (int y = boxTop; y < boxBottom; y++) for (int x = boxLeft; x < boxRight; x++) { luminance[luma(image.getRGB(x, y))]++; count++; }
        int threshold = 255;
        for (int seen = 0; threshold > 0; threshold--) if ((seen += luminance[threshold]) * 10 >= count) break;
        if (threshold < LIGHT_LUMA) return 0;
        var r = new int[256]; var g = new int[256]; var b = new int[256];
        int light = 0;
        for (int y = boxTop; y < boxBottom; y++) for (int x = boxLeft; x < boxRight; x++) {
            int p = image.getRGB(x, y);
            if (luma(p) < threshold) continue;
            r[(p >>> 16) & 255]++; g[(p >>> 8) & 255]++; b[p & 255]++; light++;
        }
        return 0xff000000 | median(r, light) << 16 | median(g, light) << 8 | median(b, light);
    }

    /** Luminance from which the brightest pixels of a box count as a light outline. */
    static final int LIGHT_LUMA = 200;

    private static int luma(int p) { return (299 * ((p >>> 16) & 255) + 587 * ((p >>> 8) & 255) + 114 * (p & 255)) / 1000; }

    private static int median(int[] histogram, int count) {
        int value = 0;
        for (int seen = 0; value < 255; value++) if ((seen += histogram[value]) * 2 >= count) break;
        return value;
    }

    /** Same window placement (the pixels may differ: an earlier window may already have been applied). */
    boolean sameGeometry(InpaintWindow other) {
        return other != null && wx == other.wx && wy == other.wy && side == other.side && left == other.left
            && top == other.top && right == other.right && bottom == other.bottom;
    }

    /**
     * Writes the model's {@code painted} window ({@link #RGB_BYTES}, planar) back: scaled to the window and only where
     * the model changed a pixel by more than {@link #CHANGED} (the removed lettering and the artwork rebuilt under
     * it), widened by {@link #FEATHER} px. Elsewhere the original stays, so the 512 px round trip never leaves a
     * blurred, tinted rectangle on plain paper.
     */
    void apply(BufferedImage image, byte[] painted) {
        if (painted == null || painted.length != RGB_BYTES) throw new IllegalArgumentException();
        var window = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < SIZE; y++) for (int x = 0; x < SIZE; x++) {
            int i = y * SIZE + x;
            window.setRGB(x, y, (painted[i] & 255) << 16 | (painted[MASK_BYTES + i] & 255) << 8 | painted[2 * MASK_BYTES + i] & 255);
        }
        var back = resize(window, side);
        if (paste == null) { paste(image, back, wx, wy, left, top, right, bottom, shape); return; }
        // Only this window's part of the lettering: the shape cut to it, so neighbour pieces are not overwritten.
        int width = right - left, pw = paste[2] - paste[0], ph = paste[3] - paste[1];
        var part = new byte[pw * ph];
        for (int y = 0; y < ph; y++) for (int x = 0; x < pw; x++)
            part[y * pw + x] = shape[(paste[1] + y - top) * width + paste[0] + x - left];
        paste(image, back, wx, wy, paste[0], paste[1], paste[2], paste[3], part);
    }

    static void paste(BufferedImage image, BufferedImage back, int wx, int wy, int left, int top, int right, int bottom) {
        paste(image, back, wx, wy, left, top, right, bottom, null);
    }

    /**
     * {@code shape}: only pixels near it (within {@link #FEATHER}) are written, and its outline pixels whatever the
     * change (a white outline rebuilt as light paper changes little, yet left in place it reads as hollow letters);
     * null for the whole rectangle.
     */
    static void paste(BufferedImage image, BufferedImage back, int wx, int wy, int left, int top, int right, int bottom,
                      byte[] shape) {
        int width = right - left, height = bottom - top;
        var changed = new boolean[width * height];
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int a = image.getRGB(left + x, top + y), b = back.getRGB(left + x - wx, top + y - wy);
            int distance = Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255))
                + Math.abs((a & 255) - (b & 255));
            int i = y * width + x;
            changed[i] = shape == null ? distance > CHANGED : shape[i] == OUTLINE || shape[i] != 0 && distance > CHANGED;
        }
        for (int y = 0; y < height; y++) {
            CleanBoxPainter.checkInterrupted();
            for (int x = 0; x < width; x++) {
                boolean near = false;
                for (int dy = -FEATHER; dy <= FEATHER && !near; dy++) for (int dx = -FEATHER; dx <= FEATHER && !near; dx++) {
                    int nx = x + dx, ny = y + dy;
                    near = nx >= 0 && ny >= 0 && nx < width && ny < height && changed[ny * width + nx];
                }
                if (near) image.setRGB(left + x, top + y, 0xff000000 | back.getRGB(left + x - wx, top + y - wy));
            }
        }
    }

    static BufferedImage resize(BufferedImage source, int size) {
        var target = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        var graphics = target.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.drawImage(source, 0, 0, size, size, null);
        } finally { graphics.dispose(); }
        return target;
    }
}
