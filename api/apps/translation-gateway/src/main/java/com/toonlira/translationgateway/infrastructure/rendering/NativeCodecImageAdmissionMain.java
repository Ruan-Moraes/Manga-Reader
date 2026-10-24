package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;

/** Explicit image-build preflight only. Never a task/controller, worker parent, Spring context or paid call. */
public final class NativeCodecImageAdmissionMain {
    private static final long MAX_ARCHIVE_BYTES = 512L * 1024 * 1024;
    private NativeCodecImageAdmissionMain() { }

    public static void main(String[] arguments) {
        try {
            require(arguments.length == 0);
            var archive = Path.of("/app/gateway.jar");
            verifyArchiveHash(archive, System.getenv("GATEWAY_NATIVE_IMAGE_JAR_SHA256"));
            RenderJvmLauncher.builder(Path.of("/tmp"), 128, RenderChildMain.class.getName(), List.of(archive), true);
            var codec = NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"),
                System.getenv("GATEWAY_RENDERING_NATIVE_DISTRIBUTION_SHA256"), Duration.ofSeconds(60));
            try (var loaded = new NativeWebpCodec(codec.library(), codec.librarySha256(), codec.sharpLibrary(),
                codec.sharpSha256(), codec.nativeTimeout())) {
                System.out.println("{\"outcome\":\"admitted-not-operational\",\"providerCalls\":0,\"images\":0}");
            }
        } catch (Throwable ignored) {
            System.out.println("{\"outcome\":\"failed\",\"failure\":\"native-image-unavailable\"}"); System.exit(1);
        }
    }

    static void verifyArchiveHash(Path path, String expected) {
        try {
            require(path != null && expected != null && expected.matches("[0-9a-f]{64}")
                && Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS) && path.toRealPath().equals(path));
            long size = Files.size(path); require(size > 0 && size <= MAX_ARCHIVE_BYTES);
            var digest = MessageDigest.getInstance("SHA-256"); long read = 0;
            try (var input = Files.newInputStream(path, LinkOption.NOFOLLOW_LINKS)) {
                var buffer = new byte[65536];
                for (int count; (count = input.read(buffer)) != -1;) {
                    read += count; require(read <= size); digest.update(buffer, 0, count);
                }
            }
            require(read == size && HexFormat.of().formatHex(digest.digest()).equals(expected));
        } catch (Exception ignored) { throw new RenderFileException(CONFIGURATION); }
    }
    private static void require(boolean valid) { if (!valid) throw new RenderFileException(CONFIGURATION); }
}
