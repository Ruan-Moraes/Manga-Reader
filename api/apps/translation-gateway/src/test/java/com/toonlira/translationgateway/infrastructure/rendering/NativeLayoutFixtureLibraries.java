package com.toonlira.translationgateway.infrastructure.rendering;

import ai.onnxruntime.OrtEnvironment;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.zip.ZipFile;

/** Explicit test preparation from an already cached, pinned SDK. Never downloads or admits production distribution. */
final class NativeLayoutFixtureLibraries {
    private static final String SDK_SHA256 = "f429cc9d64b3bcef00bfac921a6aa231b3c280bee2e55c27f2563035b1a44104";
    private static final long MAX_BYTES = 64L * 1024 * 1024;
    private NativeLayoutFixtureLibraries() { }

    static Path prepare(Path root, NativeCodecPlatform target) throws Exception {
        var sdk = Path.of(OrtEnvironment.class.getProtectionDomain().getCodeSource().getLocation().toURI()).toRealPath();
        requireHash(sdk, SDK_SHA256);
        String platform;
        List<String> hashes;
        if (target == NativeCodecPlatform.ARM64_GLIBC) {
            platform = "linux-aarch64";
            hashes = List.of("e18fe095919d8613ead3a31ff78212bde4fad929418a9b48f49d61c829ed5c82",
                "5b7778d009485672e9c24a60a33def1f4fbf50c95c11e08dc212707f3c936b60");
        } else if (target == NativeCodecPlatform.AMD64_GLIBC) {
            platform = "linux-x64";
            hashes = List.of("ffc84d48e845cf0b562ba4ea5ca32aaafc0d4069019fef4f63095b307d0270ad",
                "3945d692879bc54eb731b217a7c967b9283298f918b8cafc703d2a5a6c522a62");
        } else throw invalid();
        var directory = Files.createDirectory(root.resolve("onnx-readonly"));
        var names = List.of("libonnxruntime.so", "libonnxruntime4j_jni.so");
        try (var zip = new ZipFile(sdk.toFile())) {
            for (int index = 0; index < names.size(); index++) {
                var entry = zip.getEntry("ai/onnxruntime/native/" + platform + "/" + names.get(index));
                if (entry == null || entry.getSize() < 1 || entry.getSize() > MAX_BYTES) throw invalid();
                var file = directory.resolve(names.get(index));
                long bytes = 0;
                try (var input = zip.getInputStream(entry); var output = Files.newOutputStream(file, StandardOpenOption.CREATE_NEW)) {
                    var buffer = new byte[65536];
                    int length;
                    while ((length = input.read(buffer)) != -1) {
                        bytes = Math.addExact(bytes, length);
                        if (bytes > MAX_BYTES) throw invalid();
                        output.write(buffer, 0, length);
                    }
                }
                if (bytes != entry.getSize()) throw invalid();
                requireHash(file, hashes.get(index));
                Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("r--r--r--"));
            }
        }
        Files.setPosixFilePermissions(directory, PosixFilePermissions.fromString("r-xr-xr-x"));
        return directory;
    }

    private static void requireHash(Path path, String expected) throws Exception {
        if (!Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS) || Files.size(path) < 1 || Files.size(path) > MAX_BYTES) throw invalid();
        var digest = MessageDigest.getInstance("SHA-256");
        long bytes = 0;
        try (var input = Files.newInputStream(path, LinkOption.NOFOLLOW_LINKS)) {
            var buffer = new byte[65536];
            int length;
            while ((length = input.read(buffer)) != -1) {
                bytes = Math.addExact(bytes, length);
                if (bytes > MAX_BYTES) throw invalid();
                digest.update(buffer, 0, length);
            }
        }
        if (!expected.equals(HexFormat.of().formatHex(digest.digest()))) throw invalid();
    }

    private static IllegalArgumentException invalid() { return new IllegalArgumentException("native-layout-fixture-invalid"); }
}
