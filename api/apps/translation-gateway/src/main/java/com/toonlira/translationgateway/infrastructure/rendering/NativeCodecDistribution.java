package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

/** Operator-pinned readonly local package. Admission never loads native code or acquires resources. */
public final class NativeCodecDistribution {
    private static final int MAX_LIBRARY_BYTES = 32 * 1024 * 1024;
    private static final int MAX_MANIFEST_BYTES = 4096;
    private static final int MAX_LICENSE_BYTES = 65536;
    private static final String SOURCE_HASH = "e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564";
    private static final String COPYING_HASH = "5aec868f669e384a22372a4e8a1a6cd7d44c64cd451f960ca69cc170d1e13acf";
    private static final String PATENTS_HASH = "cc3273e0694ea5896145e0677699b53471b03ea43021ddc50e7923fbb9f5023c";
    private static final String WEBP = "libwebp.so.7", SHARP = "libsharpyuv.so.0";
    private static final Set<String> FILES = Set.of(WEBP, SHARP, "COPYING", "PATENTS", "manifest.properties");
    private static final Set<String> KEYS = Set.of("format", "version", "platform", "source.sha256", "webp.sha256",
        "sharp.sha256", "copying.sha256", "patents.sha256");
    private static final Set<PosixFilePermission> WRITE = Set.of(PosixFilePermission.OWNER_WRITE,
        PosixFilePermission.GROUP_WRITE, PosixFilePermission.OTHERS_WRITE);

    private NativeCodecDistribution() { }

    public static NativeRenderChildSettings admit(Path directory, String manifestSha256, Duration nativeTimeout) {
        return admit(directory, manifestSha256, nativeTimeout, null);
    }

    static NativeRenderChildSettings admitForRuntime(Path directory, String manifestSha256, Duration nativeTimeout) {
        return admit(directory, manifestSha256, nativeTimeout, NativeCodecPlatform.runtime());
    }

    static NativeRenderChildSettings admit(Path directory, String manifestSha256, Duration nativeTimeout,
                                          NativeCodecPlatform expectedPlatform) {
        try {
            require(directory != null && directory.isAbsolute() && directory.normalize().equals(directory)
                && directory.toRealPath().equals(directory) && Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS));
            readonly(directory); var names = new HashSet<String>();
            try (var entries = Files.list(directory)) { entries.forEach(file -> names.add(file.getFileName().toString())); }
            require(names.equals(FILES));
            var manifest = metadata(checked(directory.resolve("manifest.properties"), manifestSha256, MAX_MANIFEST_BYTES));
            var platform = NativeCodecPlatform.fromManifest(manifest.get("platform"));
            require(expectedPlatform == null || expectedPlatform == platform);
            require("toonlira-native-codec-1".equals(manifest.get("format")) && "1.6.0".equals(manifest.get("version"))
                && SOURCE_HASH.equals(manifest.get("source.sha256"))
                && COPYING_HASH.equals(manifest.get("copying.sha256")) && PATENTS_HASH.equals(manifest.get("patents.sha256")));
            checked(directory.resolve("COPYING"), COPYING_HASH, MAX_LICENSE_BYTES);
            checked(directory.resolve("PATENTS"), PATENTS_HASH, MAX_LICENSE_BYTES);
            NativeCodecElf.verify(checked(directory.resolve(WEBP), manifest.get("webp.sha256"), MAX_LIBRARY_BYTES),
                WEBP, platform.webpDependencies(), platform);
            NativeCodecElf.verify(checked(directory.resolve(SHARP), manifest.get("sharp.sha256"), MAX_LIBRARY_BYTES),
                SHARP, platform.sharpDependencies(), platform);
            return new NativeRenderChildSettings(directory.resolve(WEBP), manifest.get("webp.sha256"),
                directory.resolve(SHARP), manifest.get("sharp.sha256"), nativeTimeout);
        } catch (Exception error) { throw new RenderFileException(CONFIGURATION); }
    }

    private static Map<String, String> metadata(byte[] bytes) {
        for (byte value : bytes) require(value == '\n' || value >= 32 && value <= 126);
        var values = new HashMap<String, String>();
        var lines = new String(bytes, StandardCharsets.US_ASCII).split("\n", -1);
        require(lines.length == KEYS.size() + 1 && lines[lines.length - 1].isEmpty());
        for (int i = 0; i < lines.length - 1; i++) {
            var line = lines[i];
            var pair = line.split("=", -1); require(pair.length == 2 && KEYS.contains(pair[0]) && !pair[1].isEmpty());
            require(values.putIfAbsent(pair[0], pair[1]) == null);
        }
        require(values.keySet().equals(KEYS)); return Map.copyOf(values);
    }
    private static byte[] checked(Path file, String expected, int limit) throws Exception {
        require(expected != null && expected.matches("[0-9a-f]{64}") && Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)
            && file.toRealPath().equals(file) && Files.size(file) > 0 && Files.size(file) <= limit);
        readonly(file); byte[] bytes;
        try (var input = Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)) { bytes = input.readNBytes(limit + 1); }
        require(bytes.length > 0 && bytes.length <= limit);
        require(expected.equals(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))));
        return bytes;
    }
    private static void readonly(Path file) throws Exception {
        require(Files.getPosixFilePermissions(file, LinkOption.NOFOLLOW_LINKS).stream().noneMatch(WRITE::contains));
    }
    private static void require(boolean condition) { if (!condition) throw new RenderFileException(CONFIGURATION); }
}
