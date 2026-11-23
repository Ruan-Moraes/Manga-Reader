package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.zip.CRC32;
import java.util.zip.DeflaterOutputStream;

/** Test-only valid PNG, one RGB row at a time. No full raster in the supervising JVM. */
final class SyntheticResourcePng {
    private static final byte[] SIGNATURE = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
    private static final int MAX_COMPRESSED_BYTES = 12 * 1024 * 1024;
    private SyntheticResourcePng() { }

    static Path write(Path path, int width, int height, boolean noise) throws Exception {
        return write(path, width, height, noise, false);
    }

    static Path multicolor(Path path, int width, int height) throws Exception {
        return write(path, width, height, false, true);
    }

    private static Path write(Path path, int width, int height, boolean noise, boolean multicolor) throws Exception {
        if (width <= 0 || width > 12_000 || height <= 0 || height > 12_000
            || (long) width * height > 80_000_000) throw new IllegalArgumentException("synthetic-resource-png-invalid");
        var compressed = new ByteArrayOutputStream();
        var row = new byte[1 + width * 3];
        Arrays.fill(row, (byte) 204);
        row[0] = 0;
        int seed = 0x71ec413d;
        try (var deflater = new DeflaterOutputStream(compressed)) {
            for (int y = 0; y < height; y++) {
                if (multicolor) for (int x = 0; x < width; x++) {
                    row[1 + x * 3] = (byte) x;
                    row[2 + x * 3] = (byte) y;
                    row[3 + x * 3] = (byte) (x + y);
                }
                if (noise) for (int x = 1; x < row.length; x++) {
                    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
                    row[x] = (byte) seed;
                }
                deflater.write(row);
                if (compressed.size() > MAX_COMPRESSED_BYTES) throw new IllegalArgumentException("synthetic-resource-png-too-large");
            }
        }
        var header = new ByteArrayOutputStream();
        try (var output = new DataOutputStream(header)) {
            output.writeInt(width); output.writeInt(height);
            output.write(new byte[] {8, 2, 0, 0, 0});
        }
        try (var output = new DataOutputStream(Files.newOutputStream(path, StandardOpenOption.CREATE_NEW))) {
            output.write(SIGNATURE);
            chunk(output, "IHDR", header.toByteArray());
            chunk(output, "IDAT", compressed.toByteArray());
            chunk(output, "IEND", new byte[0]);
        }
        return path;
    }

    private static void chunk(DataOutputStream output, String kind, byte[] bytes) throws Exception {
        var name = kind.getBytes(StandardCharsets.US_ASCII);
        var crc = new CRC32(); crc.update(name); crc.update(bytes);
        output.writeInt(bytes.length); output.write(name); output.write(bytes); output.writeInt((int) crc.getValue());
    }
}
