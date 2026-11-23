package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class NativeCodecDistributionTest {
    @TempDir Path temporary;

    @Test void admitsOnlyPinnedReadonlyMetadataWithoutLoadingLibraries() throws Exception {
        var directory = fixture(); var hash = sha(Files.readAllBytes(directory.resolve("manifest.properties")));
        var settings = NativeCodecDistribution.admit(directory, hash, Duration.ofSeconds(60));
        assertThat(settings.library()).isEqualTo(directory.resolve("libwebp.so.7"));
        assertThat(settings.sharpLibrary()).isEqualTo(directory.resolve("libsharpyuv.so.0"));
        assertThat(settings.toString()).doesNotContain(directory.toString(), hash).contains("redacted");
        rejected(directory, "a".repeat(64)); rejected(Path.of("relative-private"), hash);
    }

    @Test void rejectsWritableDirectoryOrFileSymlinksAndUnexpectedFiles() throws Exception {
        var directory = fixture(); var hash = sha(Files.readAllBytes(directory.resolve("manifest.properties")));
        writable(directory); rejected(directory, hash); readonly(directory);
        var library = directory.resolve("libwebp.so.7");
        writable(library); rejected(directory, hash); readonly(library);
        var alias = temporary.resolve("alias"); Files.createSymbolicLink(alias, directory); rejected(alias, hash);
        writable(directory); Files.writeString(directory.resolve("extra"), "private"); readonly(directory); rejected(directory, hash);
    }

    @Test void rejectsChangedArtifactsAndDuplicateOrUnknownManifestProperties() throws Exception {
        var directory = fixture(); var file = directory.resolve("manifest.properties"); var original = Files.readAllBytes(file);
        for (var suffix : List.of("version=1.6.0\n", "private.secret=value\n", "\n", "version=1.6.1\n")) {
            writable(file); Files.writeString(file, new String(original, StandardCharsets.US_ASCII) + suffix); readonly(file);
            rejected(directory, sha(Files.readAllBytes(file)));
        }
        writable(file); Files.write(file, original); readonly(file);
        var license = directory.resolve("COPYING"); writable(license); Files.writeString(license, "altered"); readonly(license);
        rejected(directory, sha(original));
    }

    @Test void admitsAmd64MetadataButRejectsCrossArchitectureRuntimeAndMixedLibraries() throws Exception {
        var directory = fixture(NativeCodecPlatform.AMD64);
        var hash = sha(Files.readAllBytes(directory.resolve("manifest.properties")));
        NativeCodecDistribution.admit(directory, hash, Duration.ofSeconds(60), NativeCodecPlatform.AMD64);
        assertThatThrownBy(() -> NativeCodecDistribution.admit(directory, hash, Duration.ofSeconds(60), NativeCodecPlatform.ARM64))
            .hasMessage("render-configuration").hasNoCause();
        var library = directory.resolve("libsharpyuv.so.0");
        var bytes = Files.readAllBytes(library);
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putShort(18, (short) 183);
        writable(library); Files.write(library, bytes); readonly(library);
        var manifest = directory.resolve("manifest.properties");
        var original = Files.readString(manifest);
        writable(manifest);
        Files.writeString(manifest, original.replaceFirst("sharp.sha256=[0-9a-f]{64}", "sharp.sha256=" + sha(bytes)));
        readonly(manifest);
        rejected(directory, sha(Files.readAllBytes(manifest)));
    }

    @ParameterizedTest @EnumSource(NativeCodecPlatform.class)
    void admitsExactDependenciesForEveryTargetAndRejectsEveryOtherRuntime(NativeCodecPlatform platform) throws Exception {
        var directory = fixture(platform); var file = directory.resolve("manifest.properties");
        var original = Files.readString(file); var hash = sha(Files.readAllBytes(file));
        NativeCodecDistribution.admit(directory, hash, Duration.ofSeconds(60), platform);
        for (var other : NativeCodecPlatform.values()) if (other != platform) {
            assertThatThrownBy(() -> NativeCodecDistribution.admit(directory, hash, Duration.ofSeconds(60), other))
                .hasMessage("render-configuration").hasNoCause();
            writable(file);
            Files.writeString(file, original.replace("platform=" + platform.manifestId(), "platform=" + other.manifestId()));
            readonly(file); rejected(directory, sha(Files.readAllBytes(file)));
        }
    }

    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void glibcCannotOmitRequiredMathOrAddUnrelatedLibraries(NativeCodecPlatform platform) throws Exception {
        var directory = fixture(platform); var library = directory.resolve("libsharpyuv.so.0");
        var file = directory.resolve("manifest.properties"); var original = Files.readString(file);
        for (var dependencies : List.of(new String[]{"libc.so.6"}, new String[]{"libc.so.6", "libm.so.6", "private.so"})) {
            var bytes = NativeCodecElfTest.fixture("libsharpyuv.so.0", "$ORIGIN", dependencies);
            ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).putShort(18, (short) platform.machine());
            writable(library); Files.write(library, bytes); readonly(library);
            writable(file); Files.writeString(file, original.replaceFirst("sharp.sha256=[0-9a-f]{64}", "sharp.sha256=" + sha(bytes)));
            readonly(file); rejected(directory, sha(Files.readAllBytes(file)));
        }
    }

    private Path fixture() throws Exception { return fixture(NativeCodecPlatform.ARM64); }

    private Path fixture(NativeCodecPlatform platform) throws Exception {
        var directory = Files.createDirectory(temporary.resolve("package-" + platform.manifestId())).toRealPath();
        var webp = NativeCodecElfTest.fixture("libwebp.so.7", "$ORIGIN", platform.webpDependencies().stream().sorted().toArray(String[]::new));
        // Synthetic metadata only, never executable native code.
        ByteBuffer.wrap(webp).order(ByteOrder.LITTLE_ENDIAN).putShort(18, (short) platform.machine());
        var sharp = NativeCodecElfTest.fixture("libsharpyuv.so.0", "$ORIGIN", platform.sharpDependencies().stream().sorted().toArray(String[]::new));
        ByteBuffer.wrap(sharp).order(ByteOrder.LITTLE_ENDIAN).putShort(18, (short) platform.machine());
        Files.write(directory.resolve("libwebp.so.7"), webp); Files.write(directory.resolve("libsharpyuv.so.0"), sharp);
        for (var name : List.of("COPYING", "PATENTS")) try (var input = getClass().getResourceAsStream("/rendering-native-license/" + name)) {
            Files.write(directory.resolve(name), input.readAllBytes());
        }
        String manifest = "format=toonlira-native-codec-1\nversion=1.6.0\nplatform=" + platform.manifestId() + "\n"
            + "source.sha256=e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564\n"
            + "webp.sha256=" + sha(webp) + "\nsharp.sha256=" + sha(sharp) + "\n"
            + "copying.sha256=" + sha(Files.readAllBytes(directory.resolve("COPYING"))) + "\n"
            + "patents.sha256=" + sha(Files.readAllBytes(directory.resolve("PATENTS"))) + "\n";
        Files.writeString(directory.resolve("manifest.properties"), manifest, StandardCharsets.US_ASCII);
        try (var files = Files.list(directory)) { for (var file : files.toList()) readonly(file); }
        readonly(directory); return directory;
    }
    private static String sha(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
    private static void rejected(Path directory, String hash) {
        assertThatThrownBy(() -> NativeCodecDistribution.admit(directory, hash, Duration.ofSeconds(60)))
            .hasMessage("render-configuration").hasNoCause();
    }
    private static void readonly(Path file) throws Exception {
        Files.setPosixFilePermissions(file, PosixFilePermissions.fromString(Files.isDirectory(file) ? "r-xr-xr-x" : "r--r--r--"));
    }
    private static void writable(Path file) throws Exception { Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rwx------")); }
}
