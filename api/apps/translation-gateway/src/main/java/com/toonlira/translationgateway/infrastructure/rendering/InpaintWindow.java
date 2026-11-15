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
record InpaintWindow(int wx, int wy, int side, int left, int top, int right, int bottom, byte[] rgb, byte[] mask) {
    static final int SIZE = 512;
    static final int RGB_BYTES = 3 * SIZE * SIZE, MASK_BYTES = SIZE * SIZE;
    private static final double CONTEXT = 2.5;
    /** Sum of channel differences above which the model really changed a pixel (not resampling noise). */
    static final int CHANGED = 60;
    static final int FEATHER = 2;

    /** The window for {@code box} = {left, top, right, bottom}, or null when the box does not fit the page. */
    static InpaintWindow prepare(BufferedImage image, int[] box) {
        int left = Math.max(0, box[0]), top = Math.max(0, box[1]);
        int right = Math.min(image.getWidth(), box[2]), bottom = Math.min(image.getHeight(), box[3]);
        int side = Math.min(Math.min(image.getWidth(), image.getHeight()),
            Math.max(SIZE, (int) Math.ceil(CONTEXT * Math.max(right - left, bottom - top))));
        if (right <= left || bottom <= top || right - left > side || bottom - top > side) return null;
        int wx = Math.clamp((left + right) / 2 - side / 2, 0, image.getWidth() - side);
        int wy = Math.clamp((top + bottom) / 2 - side / 2, 0, image.getHeight() - side);
        var input = resize(image.getSubimage(wx, wy, side, side), SIZE);
        var rgb = new byte[RGB_BYTES];
        var mask = new byte[MASK_BYTES];
        double scale = (double) SIZE / side;
        for (int y = 0; y < SIZE; y++) for (int x = 0; x < SIZE; x++) {
            int pixel = input.getRGB(x, y), i = y * SIZE + x;
            rgb[i] = (byte) (pixel >> 16);
            rgb[MASK_BYTES + i] = (byte) (pixel >> 8);
            rgb[2 * MASK_BYTES + i] = (byte) pixel;
            double px = wx + (x + .5) / scale, py = wy + (y + .5) / scale;
            mask[i] = (byte) (px >= left - 1 && px < right + 1 && py >= top - 1 && py < bottom + 1 ? 1 : 0);
        }
        return new InpaintWindow(wx, wy, side, left, top, right, bottom, rgb, mask);
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
        paste(image, resize(window, side), wx, wy, left, top, right, bottom);
    }

    static void paste(BufferedImage image, BufferedImage back, int wx, int wy, int left, int top, int right, int bottom) {
        int width = right - left, height = bottom - top;
        var changed = new boolean[width * height];
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int a = image.getRGB(left + x, top + y), b = back.getRGB(left + x - wx, top + y - wy);
            int distance = Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255))
                + Math.abs((a & 255) - (b & 255));
            changed[y * width + x] = distance > CHANGED;
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
