package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;

/** Test-only fixture creator. Maximum raster allocation is permitted ONLY in its isolated preparation JVM. */
final class SyntheticResourceJpeg {
    private static final int MAX_BYTES = 12 * 1024 * 1024;
    private static final int MAX_DIMENSION = 12000;
    private static final long MAX_PIXELS = 80000000;
    private static final float FIXTURE_QUALITY = .9f;
    private SyntheticResourceJpeg() { }

    static void write(Path file, int width, int height) {
        if (file == null || width <= 0 || height <= 0 || width > MAX_DIMENSION || height > MAX_DIMENSION
            || (long) width * height > MAX_PIXELS || Files.exists(file, LinkOption.NOFOLLOW_LINKS)) invalid();
        boolean owned = false;
        BufferedImage image = null;
        try {
            var raw = Files.newOutputStream(file, StandardOpenOption.WRITE, StandardOpenOption.CREATE_NEW, LinkOption.NOFOLLOW_LINKS);
            owned = true;
            try (var output = new LimitedOutput(raw); var encoded = ImageIO.createImageOutputStream(output)) {
                image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
                var pixels = ((DataBufferInt) image.getRaster().getDataBuffer()).getData();
                for (int y = 0; y < height; y++) for (int x = 0; x < width; x++)
                    pixels[y * width + x] = (x & 255) << 16 | (y & 255) << 8 | (x + y & 255);
                var writer = ImageIO.getImageWritersByFormatName("jpeg").next();
                try {
                    var settings = writer.getDefaultWriteParam();
                    settings.setCompressionMode(ImageWriteParam.MODE_EXPLICIT); settings.setCompressionQuality(FIXTURE_QUALITY);
                    writer.setOutput(encoded); writer.write(null, new IIOImage(image, null, null), settings); encoded.flush();
                } finally { writer.dispose(); }
            }
            if (Files.size(file) <= 0 || Files.size(file) > MAX_BYTES) invalid();
        } catch (Exception error) {
            if (owned) try { Files.deleteIfExists(file); } catch (IOException ignored) { }
            invalid();
        } finally { if (image != null) image.flush(); }
    }

    private static void invalid() { throw new IllegalStateException("synthetic-resource-jpeg-invalid"); }

    private static final class LimitedOutput extends FilterOutputStream {
        private int size;
        private LimitedOutput(OutputStream output) { super(output); }
        @Override public void write(int value) throws IOException { reserve(1); out.write(value); }
        @Override public void write(byte[] bytes, int offset, int length) throws IOException { reserve(length); out.write(bytes, offset, length); }
        private void reserve(int length) throws IOException {
            if (length < 0 || length > MAX_BYTES - size) throw new IOException("synthetic-resource-jpeg-limit");
            size += length;
        }
    }
}
