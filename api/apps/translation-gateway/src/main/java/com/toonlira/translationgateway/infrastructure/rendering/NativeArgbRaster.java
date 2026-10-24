package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.INVALID_MEDIA;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;
import static java.lang.foreign.ValueLayout.JAVA_INT;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.Point;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.awt.image.DataBuffer;
import java.awt.image.Raster;
import java.awt.image.SinglePixelPackedSampleModel;
import java.io.IOException;
import java.lang.foreign.Arena;
import java.lang.foreign.MemorySegment;
import java.util.Arrays;

/** Owned native ARGB storage, shared by Java raster views and a future borrowed native pointer. */
final class NativeArgbRaster implements AutoCloseable {
    private static final int[] ARGB_MASKS = {0x00ff0000, 0x0000ff00, 0x000000ff, 0xff000000};
    private final Thread owner = Thread.currentThread();
    private final Arena arena;
    private final MemorySegment pixels;
    private final BufferedImage image;

    NativeArgbRaster(int width, int height, RenderPolicy policy) {
        ValidatedRasterDecoder.checkInterrupted();
        try { PamRasterIo.dimensions(width, height, policy); }
        catch (IOException error) { throw new RenderFileException(INVALID_MEDIA); }
        arena = Arena.ofConfined();
        try {
            int count = Math.multiplyExact(width, height);
            pixels = arena.allocate(Math.multiplyExact((long) count, Integer.BYTES), Integer.BYTES);
            var data = new NativeDataBuffer(pixels, count);
            var raster = Raster.createWritableRaster(new SinglePixelPackedSampleModel(
                DataBuffer.TYPE_INT, width, height, width, ARGB_MASKS), data, new Point(0, 0));
            image = new BufferedImage(ColorModel.getRGBdefault(), raster, false, null);
        } catch (RuntimeException | Error error) {
            arena.close();
            throw error;
        }
    }

    BufferedImage image() { checkOwner(); return image; }
    MemorySegment pixels() { checkOwner(); return pixels; }

    static boolean isView(BufferedImage candidate) {
        if (candidate == null || candidate.isAlphaPremultiplied()
            || candidate.getColorModel() != ColorModel.getRGBdefault()
            || !(candidate.getRaster().getDataBuffer() instanceof NativeDataBuffer data)
            || !(candidate.getRaster().getSampleModel() instanceof SinglePixelPackedSampleModel model)) return false;
        return data.available() && candidate.getRaster().getSampleModelTranslateX() == 0
            && candidate.getRaster().getSampleModelTranslateY() == 0
            && model.getScanlineStride() == candidate.getWidth()
            && Arrays.equals(model.getBitMasks(), ARGB_MASKS);
    }

    private void checkOwner() {
        if (Thread.currentThread() != owner || !arena.scope().isAlive()) throw new RenderFileException(UNAVAILABLE);
    }

    @Override public void close() {
        if (Thread.currentThread() != owner) throw new RenderFileException(UNAVAILABLE);
        if (!arena.scope().isAlive()) return;
        try { image.flush(); }
        finally { arena.close(); }
    }

    @Override public String toString() { return "NativeArgbRaster[redacted]"; }

    private static final class NativeDataBuffer extends DataBuffer {
        private final MemorySegment pixels;
        NativeDataBuffer(MemorySegment pixels, int count) {
            super(TYPE_INT, count);
            this.pixels = pixels;
        }
        @Override public int getElem(int index) {
            check(index);
            return pixels.getAtIndex(JAVA_INT, index);
        }
        @Override public void setElem(int index, int value) {
            check(index);
            pixels.setAtIndex(JAVA_INT, index, value);
        }
        @Override public int getElem(int bank, int index) { checkBank(bank); return getElem(index); }
        @Override public void setElem(int bank, int index, int value) { checkBank(bank); setElem(index, value); }
        private void check(int index) {
            if (!available()) throw new RenderFileException(UNAVAILABLE);
            if (index < 0 || index >= getSize()) throw new IndexOutOfBoundsException("invalid-raster-index");
        }
        private boolean available() {
            return pixels.scope().isAlive() && pixels.isAccessibleBy(Thread.currentThread());
        }
        private static void checkBank(int bank) {
            if (bank != 0) throw new IndexOutOfBoundsException("invalid-raster-index");
        }
    }
}
