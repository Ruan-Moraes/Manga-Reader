package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class NativeWebpCodecTest {
    @TempDir Path root;
    @Test void compressionMethodCannotBeOverriddenOutsideTheVersionedPolicy() {
        assertThat(NativeWebpCodec.class.getDeclaredConstructors()).allSatisfy(constructor ->
            assertThat(constructor.getParameterCount()).isEqualTo(5));
    }
    @Test void malformedConfigurationFailsBeforeNativeLoad() throws Exception {
        var library = root.resolve("not-a-library.so"); Files.writeString(library, "synthetic-invalid-library");
        for (var timeout : List.of(Duration.ZERO, Duration.ofSeconds(-1), Duration.ofSeconds(61))) {
            assertThatThrownBy(() -> new NativeWebpCodec(library, "0".repeat(64), library, "0".repeat(64), timeout))
                .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration").hasNoCause();
        }
        assertThatThrownBy(() -> new NativeWebpCodec(library, "0".repeat(64), library, "0".repeat(64), Duration.ofSeconds(60)))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration").hasNoCause();
        assertThat(Files.readString(library)).isEqualTo("synthetic-invalid-library");
    }
    @Test void missingRelativeAndSymlinkLibrariesFailClosed() throws Exception {
        var missing = root.resolve("missing.so");
        for (var path : List.of(missing, Path.of("relative.so"))) {
            assertThatThrownBy(() -> new NativeWebpCodec(path, "0".repeat(64), path, "0".repeat(64), Duration.ofSeconds(1)))
                .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration").hasNoCause();
        }
        var file=root.resolve("file.so"); Files.writeString(file, "test");
        var alias=root.resolve("alias.so"); Files.createSymbolicLink(alias,file);
        assertThatThrownBy(() -> new NativeWebpCodec(alias, "0".repeat(64), file, "0".repeat(64), Duration.ofSeconds(1)))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration").hasNoCause();
    }
}
