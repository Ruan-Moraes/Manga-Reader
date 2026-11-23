package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.DataOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.zip.CRC32;

/** Test-client generator only. The caller mounts /inputs as private client tmpfs, never on the server. */
public final class VolatileSyntheticFixtureMain {
    private VolatileSyntheticFixtureMain() { }
    public static void main(String[] arguments) {
        try {
            if (arguments.length != 1) throw new IllegalArgumentException();
            var root = Path.of("/inputs");
            SyntheticResourcePng.multicolor(root.resolve("small.png"), 320, 220);
            var maximum = SyntheticResourcePng.multicolor(root.resolve("maximum.png"), 10000, 8000);
            SyntheticResourceJpeg.write(root.resolve("maximum.jpg"), 10000, 8000);
            VolatileWebpFixtureProbe.generate(maximum, root.resolve("maximum.webp"), arguments[0]);
            pad(maximum, root.resolve("maximum-padded.png"));
            SyntheticResourcePng.multicolor(root.resolve("wide.png"), 12000, 6666);
            SyntheticResourcePng.multicolor(root.resolve("tall.png"), 6666, 12000);
            SyntheticResourcePng.multicolor(root.resolve("row.png"), 12000, 1);
            SyntheticResourcePng.multicolor(root.resolve("column.png"), 1, 12000);
            System.out.println("volatile-synthetic-client-fixtures-ready");
        } catch (Throwable error) {
            System.err.println("volatile-synthetic-fixture-failed:" + error.getClass().getSimpleName());
            System.exit(1);
        }
    }
    private static void pad(Path source, Path destination) throws Exception {
        byte[] original = Files.readAllBytes(source);
        byte[] padding = new byte[12 * 1024 * 1024 - original.length - 12];
        try {
            byte[] type = "npAD".getBytes(StandardCharsets.US_ASCII);
            var crc = new CRC32(); crc.update(type); crc.update(padding);
            try (var output = new DataOutputStream(Files.newOutputStream(destination, StandardOpenOption.CREATE_NEW))) {
                output.write(original, 0, original.length - 12);
                output.writeInt(padding.length); output.write(type); output.write(padding); output.writeInt((int) crc.getValue());
                output.write(original, original.length - 12, 12);
            }
        } finally { Arrays.fill(original, (byte) 0); Arrays.fill(padding, (byte) 0); }
    }
}
