package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/** Row-sized transport, not an additional page-sized pixel/PNG buffer. */
final class PamRasterIo {
    private static final int MAX_HEADER_BYTES = 1024;
    private static final int RGBA_DEPTH = 4;
    private static final Set<String> FIELDS = Set.of("WIDTH", "HEIGHT", "DEPTH", "MAXVAL", "TUPLTYPE");

    private PamRasterIo() { }

    static void write(BufferedImage image, OutputStream output, RenderPolicy policy) throws IOException {
        if (image == null || output == null) throw invalid();
        int width = image.getWidth(), height = image.getHeight();
        dimensions(width, height, policy);
        String header = "P7\nWIDTH " + width + "\nHEIGHT " + height
            + "\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n";
        output.write(header.getBytes(StandardCharsets.US_ASCII));
        var row = new int[width];
        var bytes = new byte[width * RGBA_DEPTH];
        for (int y = 0; y < height; y++) {
            image.getRGB(0, y, width, 1, row, 0, width);
            for (int x = 0; x < width; x++) {
                int offset = x * RGBA_DEPTH, argb = row[x];
                bytes[offset] = (byte) (argb >> 16);
                bytes[offset + 1] = (byte) (argb >> 8);
                bytes[offset + 2] = (byte) argb;
                bytes[offset + 3] = (byte) (argb >>> 24);
            }
            output.write(bytes);
        }
    }

    static BufferedImage read(InputStream input, int width, int height, RenderPolicy policy) throws IOException {
        dimensions(width, height, policy);
        if (input == null) throw invalid();
        var header = header(input);
        int depth = number(header, "DEPTH");
        if (number(header, "WIDTH") != width || number(header, "HEIGHT") != height
            || number(header, "MAXVAL") != 255 || (depth != 3 && depth != RGBA_DEPTH)
            || !(depth == 3 ? "RGB" : "RGB_ALPHA").equals(header.get("TUPLTYPE"))) throw invalid();
        var image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        var row = new int[width];
        var bytes = new byte[width * depth];
        for (int y = 0; y < height; y++) {
            int offset = 0;
            while (offset < bytes.length) {
                int read = input.read(bytes, offset, bytes.length - offset);
                if (read < 0) throw invalid();
                if (read == 0) continue;
                offset += read;
            }
            for (int x = 0; x < width; x++) {
                int base = x * depth;
                int alpha = depth == RGBA_DEPTH ? bytes[base + 3] & 255 : 255;
                row[x] = (alpha << 24) | ((bytes[base] & 255) << 16)
                    | ((bytes[base + 1] & 255) << 8) | (bytes[base + 2] & 255);
            }
            image.setRGB(0, y, width, 1, row, 0, width);
        }
        if (input.read() != -1) throw invalid();
        return image;
    }

    static void dimensions(int width, int height, RenderPolicy policy) throws IOException {
        if (policy == null || width <= 0 || height <= 0 || width > policy.maxWidthPx()
            || height > policy.maxHeightPx() || (long) width * height > policy.maxPixels()) throw invalid();
    }

    private static Map<String, String> header(InputStream input) throws IOException {
        var fields = new HashMap<String, String>();
        var line = new StringBuilder();
        boolean magic = false;
        for (int count = 0; count < MAX_HEADER_BYTES; count++) {
            int value = input.read();
            if (value == -1 || (value != '\n' && (value < 32 || value > 126))) throw invalid();
            if (value != '\n') { line.append((char) value); continue; }
            String text = line.toString();
            line.setLength(0);
            if (!magic) {
                if (!"P7".equals(text)) throw invalid();
                magic = true;
            } else if ("ENDHDR".equals(text)) {
                if (!fields.keySet().equals(FIELDS)) throw invalid();
                return fields;
            } else if (!text.startsWith("#")) {
                int separator = text.indexOf(' ');
                if (separator < 1 || separator == text.length() - 1) throw invalid();
                String key = text.substring(0, separator), entry = text.substring(separator + 1);
                if (!FIELDS.contains(key) || fields.putIfAbsent(key, entry) != null) throw invalid();
            }
        }
        throw invalid();
    }

    private static int number(Map<String, String> fields, String key) throws IOException {
        try {
            String value = fields.get(key);
            if (value == null || !value.matches("[1-9][0-9]{0,8}")) throw invalid();
            return Integer.parseInt(value);
        } catch (NumberFormatException malformed) { throw invalid(); }
    }

    private static IOException invalid() { return new IOException("invalid-raster"); }
}
