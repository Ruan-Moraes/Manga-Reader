package com.mangareader.translationgateway.application;

import static com.mangareader.translationgateway.domain.GatewayErrorCode.INVALID_REQUEST;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.PAYLOAD_TOO_LARGE;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;
import static com.mangareader.translationgateway.domain.GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE;

import com.mangareader.translationgateway.domain.GatewayException;
import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

@Component
public class MediaInspectionService {
    private static final int MAX_JPEG_HEADER_BYTES = 1_048_576;

    public InspectedMedia inspect(InputStream input, long maxBytes) {
        Path temporary = null;
        try {
            temporary = Files.createTempFile("translation-page-", ".upload");
            var digest = MessageDigest.getInstance("SHA-256");
            long size = 0;
            try (var source = new DigestInputStream(new BufferedInputStream(input), digest);
                 var output = Files.newOutputStream(temporary)) {
                var buffer = new byte[16_384];
                int read;
                while ((read = source.read(buffer)) >= 0) {
                    size += read;
                    if (size > maxBytes) throw new GatewayException(PAYLOAD_TOO_LARGE, 413, false);
                    output.write(buffer, 0, read);
                }
            }
            if (size == 0) throw new GatewayException(INVALID_REQUEST, 400, false);
            Dimensions dimensions;
            try {
                dimensions = inspectHeader(temporary);
            } catch (IOException malformed) {
                throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
            }
            return new InspectedMedia(temporary, dimensions.mimeType(), size, dimensions.width(), dimensions.height(),
                HexFormat.of().formatHex(digest.digest()));
        } catch (GatewayException error) {
            deleteQuietly(temporary);
            throw error;
        } catch (IOException | NoSuchAlgorithmException error) {
            deleteQuietly(temporary);
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    private Dimensions inspectHeader(Path path) throws IOException {
        try (var input = new DataInputStream(new BufferedInputStream(Files.newInputStream(path)))) {
            var first = input.readNBytes(32);
            if (first.length >= 24 && isPng(first)) {
                return valid(new Dimensions("image/png", bigEndianInt(first, 16), bigEndianInt(first, 20)));
            }
            if (first.length >= 30 && isWebp(first)) return valid(inspectWebp(first));
        }
        return inspectJpeg(path);
    }

    private boolean isPng(byte[] value) {
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        for (int index = 0; index < signature.length; index++) if (value[index] != signature[index]) return false;
        return ascii(value, 12, 4).equals("IHDR");
    }

    private boolean isWebp(byte[] value) {
        return ascii(value, 0, 4).equals("RIFF") && ascii(value, 8, 4).equals("WEBP");
    }

    private Dimensions inspectWebp(byte[] value) {
        var kind = ascii(value, 12, 4);
        if ("VP8X".equals(kind)) {
            return new Dimensions("image/webp", 1 + little24(value, 24), 1 + little24(value, 27));
        }
        if ("VP8L".equals(kind) && value[20] == 0x2f) {
            int b0 = unsigned(value[21]);
            int b1 = unsigned(value[22]);
            int b2 = unsigned(value[23]);
            int b3 = unsigned(value[24]);
            return new Dimensions("image/webp", 1 + b0 + ((b1 & 0x3f) << 8),
                1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)));
        }
        if ("VP8 ".equals(kind) && unsigned(value[23]) == 0x9d && unsigned(value[24]) == 0x01 && unsigned(value[25]) == 0x2a) {
            return new Dimensions("image/webp", little16(value, 26) & 0x3fff, little16(value, 28) & 0x3fff);
        }
        throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
    }

    private Dimensions inspectJpeg(Path path) throws IOException {
        try (var input = new DataInputStream(new BufferedInputStream(Files.newInputStream(path)))) {
            if (input.readUnsignedShort() != 0xffd8) throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
            int scanned = 2;
            while (scanned < MAX_JPEG_HEADER_BYTES) {
                int prefix;
                do { prefix = input.readUnsignedByte(); scanned++; } while (prefix != 0xff && scanned < MAX_JPEG_HEADER_BYTES);
                int marker;
                do { marker = input.readUnsignedByte(); scanned++; } while (marker == 0xff);
                if (marker == 0xd9 || marker == 0xda) break;
                int length = input.readUnsignedShort();
                scanned += 2;
                if (length < 2) break;
                if (isStartOfFrame(marker)) {
                    input.readUnsignedByte();
                    int height = input.readUnsignedShort();
                    int width = input.readUnsignedShort();
                    return valid(new Dimensions("image/jpeg", width, height));
                }
                input.skipNBytes(length - 2L);
                scanned += length - 2;
            }
        }
        throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
    }

    private boolean isStartOfFrame(int marker) {
        return marker >= 0xc0 && marker <= 0xcf && marker != 0xc4 && marker != 0xc8 && marker != 0xcc;
    }

    private Dimensions valid(Dimensions dimensions) {
        if (dimensions.width() <= 0 || dimensions.height() <= 0) throw new GatewayException(INVALID_REQUEST, 400, false);
        return dimensions;
    }

    private String ascii(byte[] value, int offset, int length) {
        return new String(value, offset, length, java.nio.charset.StandardCharsets.US_ASCII);
    }

    private int unsigned(byte value) { return value & 0xff; }
    private int little16(byte[] value, int offset) { return unsigned(value[offset]) | (unsigned(value[offset + 1]) << 8); }
    private int little24(byte[] value, int offset) { return little16(value, offset) | (unsigned(value[offset + 2]) << 16); }
    private int bigEndianInt(byte[] value, int offset) {
        return (unsigned(value[offset]) << 24) | (unsigned(value[offset + 1]) << 16)
            | (unsigned(value[offset + 2]) << 8) | unsigned(value[offset + 3]);
    }

    public void deleteQuietly(Path path) {
        if (path == null) return;
        try { Files.deleteIfExists(path); } catch (IOException ignored) { }
    }

    public record InspectedMedia(Path path, String mimeType, long byteSize, int widthPx, int heightPx, String sha256) { }
    private record Dimensions(String mimeType, int width, int height) { }
}
