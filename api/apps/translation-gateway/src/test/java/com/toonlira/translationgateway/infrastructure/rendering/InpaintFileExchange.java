package com.toonlira.translationgateway.infrastructure.rendering;

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
 * The retired stored pipeline's file exchange of inpainting windows (staging directory). Production only exchanges
 * them over the volatile child's pipe ({@link InpaintExchange}); this stays for the legacy render tests.
 */
final class InpaintFileExchange {
    private InpaintFileExchange() { }

    static void writeWindows(Path file, List<InpaintWindow> windows) throws IOException {
        if (windows.size() > InpaintExchange.MAX_WINDOWS) throw new IllegalArgumentException();
        try (var out = new DataOutputStream(new BufferedOutputStream(Files.newOutputStream(file, StandardOpenOption.CREATE_NEW,
            StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS)))) {
            out.writeInt(InpaintExchange.REQUEST_MAGIC);
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
        if (size > InpaintExchange.MAX_REQUEST_BYTES || !Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)) throw new IOException("invalid");
        try (var in = new DataInputStream(new BufferedInputStream(Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)))) {
            if (in.readInt() != InpaintExchange.REQUEST_MAGIC) throw new IOException("invalid");
            int count = in.readInt();
            if (count < 0 || count > InpaintExchange.MAX_WINDOWS
                || size != Integer.BYTES * 2L + count * (InpaintExchange.GEOMETRY_BYTES + InpaintWindow.RGB_BYTES + (long) InpaintWindow.MASK_BYTES))
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
        if (patches.size() > InpaintExchange.MAX_WINDOWS) throw new IllegalArgumentException();
        try (var out = new DataOutputStream(new BufferedOutputStream(Files.newOutputStream(file, StandardOpenOption.CREATE_NEW,
            StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS)))) {
            out.writeInt(InpaintExchange.PATCHES_MAGIC);
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
        if (size != Integer.BYTES * 2L + expected * (1L + InpaintWindow.RGB_BYTES) || expected > InpaintExchange.MAX_WINDOWS
            || !Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)) throw new IOException("invalid");
        try (var in = new DataInputStream(new BufferedInputStream(Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)))) {
            if (in.readInt() != InpaintExchange.PATCHES_MAGIC || in.readInt() != expected) throw new IOException("invalid");
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
        var request = directory.resolve(InpaintExchange.REQUEST);
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
        writePatches(directory.resolve(InpaintExchange.PATCHES), patches);
        return true;
    }
}
