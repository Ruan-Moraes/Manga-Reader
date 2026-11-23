package com.toonlira.translationgateway.infrastructure.rendering;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtLoggingLevel;
import ai.onnxruntime.OrtSession;
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
public final class LamaInpainter implements Inpainter, InpaintModel, AutoCloseable {
    public static final String SHA256 = "1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6";
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
    public boolean inpaint(BufferedImage image, int[] box, double[] quad) {
        // All pieces are rebuilt before any is written: a failure leaves the raster untouched.
        int pieces = InpaintWindow.pieces(image, box);
        var work = pieces == 1 ? image : copy(image);
        for (int piece = 0; piece < pieces; piece++) {
            var window = InpaintWindow.prepare(image, work, box, piece, quad);
            if (window == null) return false;
            var painted = run(window.rgb(), window.mask());
            if (painted == null) return false;
            window.apply(work, painted);
        }
        if (work != image) image.setData(work.getRaster());
        return true;
    }

    private static BufferedImage copy(BufferedImage image) {
        var copy = new BufferedImage(image.getColorModel(), image.copyData(null), image.isAlphaPremultiplied(), null);
        return copy;
    }

    @Override
    public byte[] run(byte[] rgb, byte[] mask) {
        int size = InpaintWindow.SIZE, plane = size * size;
        if (rgb == null || mask == null || rgb.length != InpaintWindow.RGB_BYTES || mask.length != InpaintWindow.MASK_BYTES) return null;
        float[] pixels = new float[3 * plane], masks = new float[plane];
        for (int i = 0; i < 3 * plane; i++) pixels[i] = (rgb[i] & 255) / 255f;
        for (int i = 0; i < plane; i++) masks[i] = mask[i] == 0 ? 0 : 1;
        float[][][] output;
        try (var a = OnnxTensor.createTensor(environment, FloatBuffer.wrap(pixels), new long[]{1, 3, size, size});
             var b = OnnxTensor.createTensor(environment, FloatBuffer.wrap(masks), new long[]{1, 1, size, size});
             var result = session.run(Map.of("image", a, "mask", b))) {
            output = ((float[][][][]) result.get(0).getValue())[0];
        } catch (OrtException | RuntimeException error) { return null; }
        // The export returns 0..255; tolerate a 0..1 export as well.
        float max = 0;
        for (var channel : output) for (var row : channel) for (float value : row) max = Math.max(max, value);
        float factor = max > 2 ? 1 : 255;
        var painted = new byte[InpaintWindow.RGB_BYTES];
        for (int c = 0; c < 3; c++) for (int y = 0; y < size; y++) for (int x = 0; x < size; x++)
            painted[c * plane + y * size + x] = (byte) Math.clamp(Math.round(output[c][y][x] * factor), 0, 255);
        return painted;
    }

    /** See {@link InpaintWindow#paste}. */
    static void paste(BufferedImage image, BufferedImage back, int wx, int wy, int left, int top, int right, int bottom) {
        InpaintWindow.paste(image, back, wx, wy, left, top, right, bottom);
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
