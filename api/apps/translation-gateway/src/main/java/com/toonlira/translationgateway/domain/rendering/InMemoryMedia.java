package com.toonlira.translationgateway.domain.rendering;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_INPUT;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** Header/container admission over bounded caller-owned bytes; never opens a file or decodes pixels. */
public final class InMemoryMedia {
    private static final long PNG_SIGNATURE = 0x89504e470d0a1a0aL;
    private static final int MAX_JPEG_HEADER_BYTES = 1_048_576;
    private InMemoryMedia() { }

    public static RenderSource inspect(byte[] bytes, RenderPolicy policy) {
        return inspect(bytes, policy, false);
    }

    public static RenderSource inspectOutput(byte[] bytes, RenderPolicy policy) {
        return inspect(bytes, policy, true);
    }

    private static RenderSource inspect(byte[] bytes, RenderPolicy policy, boolean output) {
        try {
            if (bytes == null || policy == null || bytes.length == 0
                || bytes.length > (output ? policy.maxOutputBytes() : policy.maxOriginalBytes())) invalid();
            var input = ByteBuffer.wrap(bytes);
            String mime;
            int width, height;
            if (bytes.length >= 33 && input.getLong(0) == PNG_SIGNATURE) {
                if (input.getInt(8) != 13 || !ascii(bytes, 12, "IHDR")) invalid();
                mime = "image/png"; width = input.getInt(16); height = input.getInt(20);
                boolean ended = false;
                for (int offset = 8; offset < bytes.length;) {
                    if (bytes.length - offset < 12) invalid();
                    long size = Integer.toUnsignedLong(input.getInt(offset));
                    if (size > bytes.length - offset - 12 || ascii(bytes, offset + 4, "acTL")
                        || ascii(bytes, offset + 4, "fcTL") || ascii(bytes, offset + 4, "fdAT")) invalid();
                    int next = (int) (offset + size + 12);
                    if (ascii(bytes, offset + 4, "IEND")) {
                        if (size != 0 || next != bytes.length) invalid();
                        ended = true;
                    }
                    offset = next;
                }
                if (!ended) invalid();
            } else if (bytes.length >= 30 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) {
                input.order(ByteOrder.LITTLE_ENDIAN);
                if (Integer.toUnsignedLong(input.getInt(4)) + 8 != bytes.length) invalid();
                for (int offset = 12; offset < bytes.length;) {
                    if (bytes.length - offset < 8) invalid();
                    long size = Integer.toUnsignedLong(input.getInt(offset + 4));
                    long padded = size + (size & 1);
                    if (padded > bytes.length - offset - 8 || ascii(bytes, offset, "ANIM") || ascii(bytes, offset, "ANMF")) invalid();
                    if (ascii(bytes, offset, "VP8X") && (size != 10 || (bytes[offset + 8] & 2) != 0)) invalid();
                    offset += (int) padded + 8;
                }
                mime = "image/webp";
                if (ascii(bytes, 12, "VP8X")) { width = 1 + little24(bytes, 24); height = 1 + little24(bytes, 27); }
                else if (ascii(bytes, 12, "VP8L") && bytes[20] == 0x2f) {
                    int bits = input.getInt(21);
                    width = 1 + (bits & 0x3fff); height = 1 + ((bits >>> 14) & 0x3fff);
                } else if (ascii(bytes, 12, "VP8 ") && (bytes[23] & 255) == 0x9d && bytes[24] == 1 && bytes[25] == 0x2a) {
                    width = Short.toUnsignedInt(input.getShort(26)) & 0x3fff;
                    height = Short.toUnsignedInt(input.getShort(28)) & 0x3fff;
                } else { invalid(); return null; }
            } else {
                input.order(ByteOrder.BIG_ENDIAN);
                if (bytes.length < 4 || Short.toUnsignedInt(input.getShort()) != 0xffd8) invalid();
                width = 0; height = 0; mime = "image/jpeg";
                while (input.position() < Math.min(bytes.length, MAX_JPEG_HEADER_BYTES)) {
                    if ((input.get() & 255) != 255) invalid();
                    int marker;
                    do { marker = input.get() & 255; } while (marker == 255);
                    if (marker == 0xd9 || marker == 0xda) break;
                    int size = Short.toUnsignedInt(input.getShort());
                    if (size < 2 || size - 2 > input.remaining()) invalid();
                    if (marker >= 0xc0 && marker <= 0xcf && marker != 0xc4 && marker != 0xc8 && marker != 0xcc) {
                        if (size < 8) invalid();
                        input.get(); height = Short.toUnsignedInt(input.getShort()); width = Short.toUnsignedInt(input.getShort());
                        break;
                    }
                    input.position(input.position() + size - 2);
                }
            }
            if (width <= 0 || height <= 0 || width > policy.maxWidthPx() || height > policy.maxHeightPx()
                || (long) width * height > policy.maxPixels()) invalid();
            return new RenderSource(mime, bytes.length, width, height, sha256(bytes));
        } catch (RenderValidationException error) { throw error; }
        catch (RuntimeException error) { throw new RenderValidationException(INVALID_INPUT); }
    }

    public static String sha256(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (NoSuchAlgorithmException error) { throw new IllegalStateException("SHA-256 unavailable"); }
    }
    private static int little24(byte[] bytes, int offset) {
        return (bytes[offset] & 255) | ((bytes[offset + 1] & 255) << 8) | ((bytes[offset + 2] & 255) << 16);
    }
    private static boolean ascii(byte[] bytes, int offset, String expected) {
        return new String(bytes, offset, expected.length(), StandardCharsets.US_ASCII).equals(expected);
    }
    private static void invalid() { throw new RenderValidationException(INVALID_INPUT); }
}
