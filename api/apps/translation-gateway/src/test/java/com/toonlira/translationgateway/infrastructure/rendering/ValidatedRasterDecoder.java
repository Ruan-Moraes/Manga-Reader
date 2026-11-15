package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CANCELLED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.INVALID_MEDIA;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.MediaInspectionService.InspectedMedia;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.awt.image.BufferedImage;
import java.awt.image.DataBuffer;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.event.IIOReadProgressListener;
import javax.imageio.stream.FileImageInputStream;

/** Consumes only the caller-owned, hash-validated compressed snapshot. No network or full raster copy. */
final class ValidatedRasterDecoder {
    private static final long PNG_HEADER_BYTES = 8;
    private static final long WEBP_HEADER_BYTES = 12;
    private final WebpProcessCodec codec;

    ValidatedRasterDecoder(WebpProcessCodec codec) { this.codec = codec; }

    BufferedImage decode(InspectedMedia media, RenderPolicy policy) {
        checkInterrupted();
        try {
            validateMedia(media, policy);
            if ("image/webp".equals(media.mimeType())) {
                var image = codec.decode(media.path(), new RenderedImage(media.mimeType(), media.byteSize(),
                    media.widthPx(), media.heightPx(), media.sha256()), policy);
                checkInterrupted();
                return image;
            }
            return decodeJdk(media, null);
        } catch (RenderFileException error) { throw error; }
        catch (RenderCodecException error) {
            checkInterrupted();
            throw new RenderFileException(error.failure() == RenderCodecException.Failure.INVALID_MEDIA ? INVALID_MEDIA : UNAVAILABLE);
        }
        catch (IOException | RuntimeException error) { throw new RenderFileException(INVALID_MEDIA); }
    }

    void decodeInto(InspectedMedia media, RenderPolicy policy, NativeArgbRaster destination) {
        checkInterrupted();
        try {
            validateMedia(media, policy);
            if (destination == null || "image/webp".equals(media.mimeType())) invalid();
            var image = destination.image();
            if (image.getWidth() != media.widthPx() || image.getHeight() != media.heightPx()) invalid();
            var data = image.getRaster().getDataBuffer();
            var decoded = decodeJdk(media, data);
            if (decoded.getRaster().getDataBuffer() != data) invalid();
            checkInterrupted();
        } catch (RenderFileException error) { throw error; }
        catch (IOException | RuntimeException error) { throw new RenderFileException(INVALID_MEDIA); }
    }

    private static void validateMedia(InspectedMedia media, RenderPolicy policy) throws IOException {
        if (media == null || policy == null || media.byteSize() <= 0 || media.byteSize() > policy.maxOriginalBytes()
            || Files.size(media.path()) != media.byteSize()) invalid();
        PamRasterIo.dimensions(media.widthPx(), media.heightPx(), policy);
        validateContainer(media);
    }

    private static BufferedImage decodeJdk(InspectedMedia media, DataBuffer shared) throws IOException {
        String expectedReader = switch (media.mimeType()) {
            case "image/png" -> "com.sun.imageio.plugins.png.PNGImageReader";
            case "image/jpeg" -> "com.sun.imageio.plugins.jpeg.JPEGImageReader";
            default -> throw new RenderFileException(INVALID_MEDIA);
        };
        try (var input = new FileImageInputStream(media.path().toFile())) {
            var readers = ImageIO.getImageReaders(input);
            ImageReader reader = null;
            try {
                while (readers.hasNext()) {
                    var candidate = readers.next();
                    if (candidate.getClass().getName().equals(expectedReader)) { reader = candidate; break; }
                    candidate.dispose();
                }
                if (reader == null) invalid();
                // JDK decoders can otherwise return a repaired/truncated image with only a warning.
                reader.addIIOReadWarningListener((source, warning) -> { throw new RenderFileException(INVALID_MEDIA); });
                reader.setInput(input, false, true);
                if (reader.getWidth(0) != media.widthPx() || reader.getHeight(0) != media.heightPx()
                    || reader.getNumImages(true) != 1) invalid();
                var type = reader.getImageTypes(0).next();
                var bridge = shared == null ? new ArgbDecodeDestination(type, media.widthPx(), media.heightPx())
                    : new ArgbDecodeDestination(type, media.widthPx(), media.heightPx(), shared);
                var destination = bridge.destination();
                var parameters = reader.getDefaultReadParam();
                parameters.setDestination(destination);
                reader.addIIOReadProgressListener(new InterruptProgress());
                checkInterrupted();
                var decoded = reader.read(0, parameters);
                checkInterrupted();
                if (decoded != destination) invalid();
                return bridge.argbView();
            } finally { if (reader != null) reader.dispose(); }
        }
    }

    static void validateContainer(InspectedMedia media) throws IOException {
        if ("image/jpeg".equals(media.mimeType())) return;
        try (var file = new RandomAccessFile(media.path().toFile(), "r")) {
            if ("image/png".equals(media.mimeType())) validatePng(file);
            else if ("image/webp".equals(media.mimeType())) validateWebp(file);
            else invalid();
        }
    }

    private static void validatePng(RandomAccessFile file) throws IOException {
        file.seek(PNG_HEADER_BYTES);
        boolean ended = false;
        while (file.getFilePointer() < file.length()) {
            checkInterrupted();
            if (file.length() - file.getFilePointer() < 12) invalid();
            long size = Integer.toUnsignedLong(file.readInt());
            String kind = ascii(file);
            if (size > file.length() - file.getFilePointer() - 4
                || kind.equals("acTL") || kind.equals("fcTL") || kind.equals("fdAT")) invalid();
            file.seek(file.getFilePointer() + size + 4);
            if (kind.equals("IEND")) {
                if (size != 0 || file.getFilePointer() != file.length()) invalid();
                ended = true;
                break;
            }
        }
        if (!ended) invalid();
    }

    private static void validateWebp(RandomAccessFile file) throws IOException {
        file.seek(4);
        if (Integer.toUnsignedLong(Integer.reverseBytes(file.readInt())) + 8 != file.length()) invalid();
        file.seek(WEBP_HEADER_BYTES);
        while (file.getFilePointer() < file.length()) {
            checkInterrupted();
            if (file.length() - file.getFilePointer() < 8) invalid();
            String kind = ascii(file);
            long size = Integer.toUnsignedLong(Integer.reverseBytes(file.readInt()));
            long padded = size + (size & 1);
            if (padded > file.length() - file.getFilePointer() || kind.equals("ANIM") || kind.equals("ANMF")) invalid();
            long end = file.getFilePointer() + padded;
            if (kind.equals("VP8X") && (size != 10 || (file.readUnsignedByte() & 0x02) != 0)) invalid();
            file.seek(end);
        }
    }

    private static String ascii(RandomAccessFile file) throws IOException {
        var bytes = new byte[4];
        file.readFully(bytes);
        return new String(bytes, StandardCharsets.US_ASCII);
    }
    static void checkInterrupted() { if (Thread.currentThread().isInterrupted()) throw new RenderFileException(CANCELLED); }
    private static void invalid() { throw new RenderFileException(INVALID_MEDIA); }

    private static final class InterruptProgress implements IIOReadProgressListener {
        private void check(ImageReader source) { if (Thread.currentThread().isInterrupted()) { source.abort(); checkInterrupted(); } }
        @Override public void sequenceStarted(ImageReader source, int minIndex) { check(source); }
        @Override public void sequenceComplete(ImageReader source) { check(source); }
        @Override public void imageStarted(ImageReader source, int imageIndex) { check(source); }
        @Override public void imageProgress(ImageReader source, float percentageDone) { check(source); }
        @Override public void imageComplete(ImageReader source) { check(source); }
        @Override public void thumbnailStarted(ImageReader source, int imageIndex, int thumbnailIndex) { check(source); }
        @Override public void thumbnailProgress(ImageReader source, float percentageDone) { check(source); }
        @Override public void thumbnailComplete(ImageReader source) { check(source); }
        @Override public void readAborted(ImageReader source) { checkInterrupted(); }
    }
}
