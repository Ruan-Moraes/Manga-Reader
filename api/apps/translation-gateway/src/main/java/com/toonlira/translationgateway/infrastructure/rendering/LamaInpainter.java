package com.toonlira.translationgateway.infrastructure.rendering;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtLoggingLevel;
import ai.onnxruntime.OrtSession;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

/**
 * LaMa (big-lama, Apache-2.0; ONNX port Carve/LaMa-ONNX {@code lama_fp32.onnx}) on CPU. The model has a fixed
 * 512x512 input: a square window around the box (at least 2.5x the box, for context) is resized to 512, inpainted,
 * scaled back, and only the box pixels are written. Measured ~0.85 s per region with 4 threads (Ryzen 7 9700X).
 */
public final class LamaInpainter implements Inpainter, AutoCloseable {
    public static final String SHA256 = "1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6";
    static final int SIZE = 512;
    private static final double CONTEXT = 2.5;
    /** Sum of channel differences above which the model really changed a pixel (not resampling noise). */
    static final int CHANGED = 60;
    static final int FEATHER = 2;
    private final OrtEnvironment environment;
    private final OrtSession session;

    public LamaInpainter(Path model, int threads) {
        verify(model);
        try {
            environment = OrtEnvironment.getEnvironment(OrtLoggingLevel.ORT_LOGGING_LEVEL_FATAL);
            try (var options = new OrtSession.SessionOptions()) {
                options.setIntraOpNumThreads(Math.max(1, threads));
                options.setInterOpNumThreads(1);
                options.setSessionLogLevel(OrtLoggingLevel.ORT_LOGGING_LEVEL_FATAL);
                session = environment.createSession(model.toString(), options);
            }
            if (!session.getInputNames().containsAll(java.util.Set.of("image", "mask"))) throw new IllegalStateException();
        } catch (OrtException | RuntimeException | LinkageError error) {
            throw new IllegalStateException("Inpainting model initialization unavailable");
        }
    }

    @Override
    public boolean inpaint(BufferedImage image, int[] box) {
        int left = Math.max(0, box[0]), top = Math.max(0, box[1]);
        int right = Math.min(image.getWidth(), box[2]), bottom = Math.min(image.getHeight(), box[3]);
        int side = Math.min(Math.min(image.getWidth(), image.getHeight()),
            Math.max(SIZE, (int) Math.ceil(CONTEXT * Math.max(right - left, bottom - top))));
        if (right <= left || bottom <= top || right - left > side || bottom - top > side) return false;
        int wx = Math.clamp((left + right) / 2 - side / 2, 0, image.getWidth() - side);
        int wy = Math.clamp((top + bottom) / 2 - side / 2, 0, image.getHeight() - side);
        var input = resize(image.getSubimage(wx, wy, side, side), SIZE);
        float[] pixels = new float[3 * SIZE * SIZE], mask = new float[SIZE * SIZE];
        double scale = (double) SIZE / side;
        for (int y = 0; y < SIZE; y++) for (int x = 0; x < SIZE; x++) {
            int rgb = input.getRGB(x, y), i = y * SIZE + x;
            pixels[i] = ((rgb >> 16) & 255) / 255f;
            pixels[SIZE * SIZE + i] = ((rgb >> 8) & 255) / 255f;
            pixels[2 * SIZE * SIZE + i] = (rgb & 255) / 255f;
            double px = wx + (x + .5) / scale, py = wy + (y + .5) / scale;
            mask[i] = px >= left - 1 && px < right + 1 && py >= top - 1 && py < bottom + 1 ? 1 : 0;
        }
        float[][][] output;
        try (var a = OnnxTensor.createTensor(environment, FloatBuffer.wrap(pixels), new long[]{1, 3, SIZE, SIZE});
             var b = OnnxTensor.createTensor(environment, FloatBuffer.wrap(mask), new long[]{1, 1, SIZE, SIZE});
             var result = session.run(Map.of("image", a, "mask", b))) {
            output = ((float[][][][]) result.get(0).getValue())[0];
        } catch (OrtException | RuntimeException error) { return false; }
        // The export returns 0..255; tolerate a 0..1 export as well.
        float max = 0;
        for (var channel : output) for (var row : channel) for (float value : row) max = Math.max(max, value);
        float factor = max > 2 ? 1 : 255;
        var painted = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < SIZE; y++) for (int x = 0; x < SIZE; x++) {
            int r = Math.clamp(Math.round(output[0][y][x] * factor), 0, 255);
            int g = Math.clamp(Math.round(output[1][y][x] * factor), 0, 255);
            int bl = Math.clamp(Math.round(output[2][y][x] * factor), 0, 255);
            painted.setRGB(x, y, r << 16 | g << 8 | bl);
        }
        var back = resize(painted, side);
        paste(image, back, wx, wy, left, top, right, bottom);
        return true;
    }

    /**
     * Writes only what the model changed: pixels whose value moved by more than {@link #CHANGED} (the removed
     * lettering and the artwork rebuilt under it), widened by {@link #FEATHER} px. Elsewhere the original stays, so
     * the 512 px round trip never leaves a blurred, tinted rectangle on plain paper.
     */
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

    static void verify(Path model) {
        try {
            if (model == null || !Files.isRegularFile(model, LinkOption.NOFOLLOW_LINKS)) throw new IllegalStateException();
            var digest = MessageDigest.getInstance("SHA-256");
            try (var input = Files.newInputStream(model)) {
                byte[] buffer = new byte[1 << 16];
                for (int read; (read = input.read(buffer)) != -1; ) digest.update(buffer, 0, read);
            }
            if (!SHA256.equals(HexFormat.of().formatHex(digest.digest()))) throw new IllegalStateException();
        } catch (IOException | NoSuchAlgorithmException | IllegalStateException error) {
            throw new IllegalStateException("Inpainting model missing or invalid");
        }
    }

    @Override public void close() { try { session.close(); } catch (OrtException ignored) { } }
}
