package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class NativeLayoutFixtureLibrariesTest {
    @TempDir Path temporary;

    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void cachedSdkProducesOnlyPinnedReadonlyLibrariesWithoutNativeInitialization(NativeCodecPlatform target) throws Exception {
        var directory = NativeLayoutFixtureLibraries.prepare(temporary, target);
        try {
            try (var files = Files.list(directory)) {
                assertThat(files.map(path -> path.getFileName().toString()).toList())
                    .containsExactlyInAnyOrder("libonnxruntime.so", "libonnxruntime4j_jni.so");
            }
            assertThat(Files.getPosixFilePermissions(directory)).isEqualTo(PosixFilePermissions.fromString("r-xr-xr-x"));
            for (var name : new String[]{"libonnxruntime.so", "libonnxruntime4j_jni.so"}) {
                var file = directory.resolve(name);
                assertThat(Files.size(file)).isBetween(1L, 64L * 1024 * 1024);
                assertThat(Files.getPosixFilePermissions(file)).isEqualTo(PosixFilePermissions.fromString("r--r--r--"));
            }
            assertThatThrownBy(() -> NativeLayoutFixtureLibraries.prepare(temporary, target))
                .isInstanceOf(FileAlreadyExistsException.class);
        } finally {
            Files.setPosixFilePermissions(directory, PosixFilePermissions.fromString("rwxr-xr-x"));
        }
    }

    @Test void unsupportedTargetFailsBeforeCreatingNativeDirectory() {
        assertThatThrownBy(() -> NativeLayoutFixtureLibraries.prepare(temporary, null))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("native-layout-fixture-invalid");
        assertThat(temporary.resolve("onnx-readonly")).doesNotExist();
    }
}
