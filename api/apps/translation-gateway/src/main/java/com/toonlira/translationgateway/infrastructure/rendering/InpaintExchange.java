package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BooleanSupplier;

/**
 * Inpainting across the isolation boundary, in two passes of the sandboxed render child. The page is decoded and
 * painted only in the child; the model (native ONNX) runs only in the parent, on fixed-size numeric windows.
 *
 * <ol>
 *   <li>The parent marks the staging directory with {@link #ENABLED} when it has a model. The child's first pass
 *   uses a {@link Recorder}: every window the painter asks for is written to {@link #REQUEST} and refused, so the
 *   first result keeps the original lettering (a complete fallback).</li>
 *   <li>The parent validates the windows (count, exact size, 0/1 mask), runs the model and writes {@link #PATCHES}.</li>
 *   <li>The child's second pass uses a {@link Replayer}: the painter asks for the same windows in the same order
 *   (same image, request and code), each is checked against the recorded geometry and the model's answer is
 *   applied with the in-process rule ({@link InpaintWindow#apply}).</li>
 * </ol>
 * Versioned binary files, never Java serialization; any mismatch refuses the window (original lettering kept).
 */
final class InpaintExchange {
    static final String ENABLED = "inpaint.enabled", REQUEST = "inpaint-request.bin", PATCHES = "inpaint-patches.bin";
    /**
     * Windows per page: a page has typically 0-3 speeches over artwork, a long title line up to
     * {@link InpaintWindow#MAX_PIECES} windows.
     */
    static final int MAX_WINDOWS = 16;
    private static final int REQUEST_MAGIC = 0x54524931, PATCHES_MAGIC = 0x54525031;
    private static final int GEOMETRY_BYTES = 7 * Integer.BYTES;
    static final long MAX_REQUEST_BYTES = Integer.BYTES * 2L + MAX_WINDOWS * (GEOMETRY_BYTES + InpaintWindow.RGB_BYTES + (long) InpaintWindow.MASK_BYTES);
    static final long MAX_PATCHES_BYTES = Integer.BYTES * 2L + MAX_WINDOWS * (1L + InpaintWindow.RGB_BYTES);

    private InpaintExchange() { }

    /** Pass 1: records the windows and refuses them, so the result is the no-inpainting fallback. */
    static final class Recorder implements Inpainter {
        private final List<InpaintWindow> windows = new ArrayList<>();

        @Override public boolean inpaint(BufferedImage image, int[] box) {
            int pieces = InpaintWindow.pieces(image, box);
            if (windows.size() + pieces > MAX_WINDOWS) return false;
            var prepared = new ArrayList<InpaintWindow>(pieces);
            for (int piece = 0; piece < pieces; piece++) {
                var window = InpaintWindow.prepare(image, box, piece);
                if (window == null) return false;   // all pieces or none: the replay asks for the same ones
                prepared.add(window);
            }
            windows.addAll(prepared);
            return false;
        }

        List<InpaintWindow> windows() { return List.copyOf(windows); }
    }

    /** Pass 2: applies the parent's answers to the same windows, in the same order. */
    static final class Replayer implements Inpainter {
        private final List<InpaintWindow> windows;
        private final List<byte[]> patches;
        private int next;

        Replayer(List<InpaintWindow> windows, List<byte[]> patches) {
            if (windows.size() != patches.size()) throw new IllegalArgumentException();
            this.windows = windows;
            this.patches = patches;
        }

        @Override public boolean inpaint(BufferedImage image, int[] box) {
            int pieces = InpaintWindow.pieces(image, box);
            if (next + pieces > windows.size()) return false;
            int first = next;
            next += pieces;
            // Every piece must match before any is applied (a lettering half rebuilt keeps its original instead), and
            // all are prepared on the page as it was, the source of the lettering's shape, as in the first pass.
            var prepared = new ArrayList<InpaintWindow>(pieces);
            for (int piece = 0; piece < pieces; piece++) {
                var window = InpaintWindow.prepare(image, box, piece);
                if (window == null || !window.sameGeometry(windows.get(first + piece)) || patches.get(first + piece) == null) return false;
                prepared.add(window);
            }
            for (int piece = 0; piece < pieces; piece++) prepared.get(piece).apply(image, patches.get(first + piece));
            return true;
        }
    }

    static void writeWindows(Path file, List<InpaintWindow> windows) throws IOException {
        if (windows.size() > MAX_WINDOWS) throw new IllegalArgumentException();
        try (var out = new DataOutputStream(new BufferedOutputStream(Files.newOutputStream(file, StandardOpenOption.CREATE_NEW,
            StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS)))) {
            out.writeInt(REQUEST_MAGIC);
            out.writeInt(windows.size());
            for (var window : windows) {
                for (int value : new int[]{window.wx(), window.wy(), window.side(), window.left(), window.top(), window.right(), window.bottom()})
                    out.writeInt(value);
                out.write(window.rgb());
                out.write(window.mask());
            }
        }
    }

    static List<InpaintWindow> readWindows(Path file) throws IOException {
        long size = Files.size(file);
        if (size > MAX_REQUEST_BYTES || !Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)) throw new IOException("invalid");
        try (var in = new DataInputStream(new BufferedInputStream(Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)))) {
            if (in.readInt() != REQUEST_MAGIC) throw new IOException("invalid");
            int count = in.readInt();
            if (count < 0 || count > MAX_WINDOWS
                || size != Integer.BYTES * 2L + count * (GEOMETRY_BYTES + InpaintWindow.RGB_BYTES + (long) InpaintWindow.MASK_BYTES))
                throw new IOException("invalid");
            var windows = new ArrayList<InpaintWindow>(count);
            for (int k = 0; k < count; k++) {
                int wx = in.readInt(), wy = in.readInt(), side = in.readInt(), left = in.readInt(), top = in.readInt(),
                    right = in.readInt(), bottom = in.readInt();
                if (wx < 0 || wy < 0 || side <= 0 || left < wx || top < wy || right <= left || bottom <= top
                    || right > wx + side || bottom > wy + side) throw new IOException("invalid");
                var rgb = in.readNBytes(InpaintWindow.RGB_BYTES);
                var mask = in.readNBytes(InpaintWindow.MASK_BYTES);
                for (byte value : mask) if (value != 0 && value != 1) throw new IOException("invalid");
                windows.add(new InpaintWindow(wx, wy, side, left, top, right, bottom, rgb, mask, null, null));
            }
            if (in.read() != -1) throw new IOException("invalid");
            return List.copyOf(windows);
        }
    }

    /** {@code patches}: one per window, null when the model could not answer (that window keeps its lettering). */
    static void writePatches(Path file, List<byte[]> patches) throws IOException {
        if (patches.size() > MAX_WINDOWS) throw new IllegalArgumentException();
        try (var out = new DataOutputStream(new BufferedOutputStream(Files.newOutputStream(file, StandardOpenOption.CREATE_NEW,
            StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS)))) {
            out.writeInt(PATCHES_MAGIC);
            out.writeInt(patches.size());
            for (var patch : patches) {
                boolean present = patch != null && patch.length == InpaintWindow.RGB_BYTES;
                out.writeBoolean(present);
                out.write(present ? patch : new byte[InpaintWindow.RGB_BYTES]);
            }
        }
    }

    static List<byte[]> readPatches(Path file, int expected) throws IOException {
        long size = Files.size(file);
        if (size != Integer.BYTES * 2L + expected * (1L + InpaintWindow.RGB_BYTES) || expected > MAX_WINDOWS
            || !Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)) throw new IOException("invalid");
        try (var in = new DataInputStream(new BufferedInputStream(Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)))) {
            if (in.readInt() != PATCHES_MAGIC || in.readInt() != expected) throw new IOException("invalid");
            var patches = new ArrayList<byte[]>(expected);
            for (int k = 0; k < expected; k++) {
                boolean present = in.readBoolean();
                var bytes = in.readNBytes(InpaintWindow.RGB_BYTES);
                patches.add(present ? bytes : null);
            }
            return java.util.Collections.unmodifiableList(patches);
        }
    }

    /**
     * Parent side: when the child's first pass asked for windows, runs the model on each and writes the answers.
     * Returns false when there was nothing to inpaint (the first result is final).
     */
    static boolean answer(Path directory, InpaintModel model, BooleanSupplier withinDeadline) throws IOException {
        var request = directory.resolve(REQUEST);
        if (!Files.exists(request, LinkOption.NOFOLLOW_LINKS)) return false;
        var windows = readWindows(request);
        if (windows.isEmpty()) return false;
        var patches = new ArrayList<byte[]>(windows.size());
        for (var window : windows) {
            if (!withinDeadline.getAsBoolean()) throw new IOException("deadline");
            byte[] painted;
            try { painted = model.run(window.rgb(), window.mask()); }
            catch (RuntimeException failed) { painted = null; }
            patches.add(painted != null && painted.length == InpaintWindow.RGB_BYTES ? painted : null);
        }
        writePatches(directory.resolve(PATCHES), patches);
        return true;
    }
}
