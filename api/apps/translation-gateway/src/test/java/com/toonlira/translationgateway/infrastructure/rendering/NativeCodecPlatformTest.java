package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.ByteOrder;
import java.util.Map;
import org.junit.jupiter.api.Test;

class NativeCodecPlatformTest {
    @Test void mapsOnlyExplicitSupportedManifestPlatforms() {
        assertThat(NativeCodecPlatform.fromManifest("linux-aarch64-musl")).isEqualTo(NativeCodecPlatform.ARM64);
        assertThat(NativeCodecPlatform.fromManifest("linux-x86_64-musl")).isEqualTo(NativeCodecPlatform.AMD64);
        assertThat(NativeCodecPlatform.ARM64.machine()).isEqualTo(183);
        assertThat(NativeCodecPlatform.AMD64.machine()).isEqualTo(62);
        assertThat(NativeCodecPlatform.ARM64.libc()).isEqualTo("libc.musl-aarch64.so.1");
        assertThat(NativeCodecPlatform.AMD64.libc()).isEqualTo("libc.musl-x86_64.so.1");
        assertThat(NativeCodecPlatform.fromManifest("linux-aarch64-glibc")).isEqualTo(NativeCodecPlatform.ARM64_GLIBC);
        assertThat(NativeCodecPlatform.fromManifest("linux-x86_64-glibc")).isEqualTo(NativeCodecPlatform.AMD64_GLIBC);
        assertThat(NativeCodecPlatform.ARM64_GLIBC.sharpDependencies()).containsExactlyInAnyOrder("libc.so.6", "libm.so.6", "ld-linux-aarch64.so.1");
        assertThat(NativeCodecPlatform.AMD64_GLIBC.webpDependencies()).containsExactlyInAnyOrder("libsharpyuv.so.0", "libc.so.6", "libm.so.6");
        for (var value : new String[]{"linux-amd64-musl", "linux-amd64-glibc", "linux-aarch64", "", "private-platform"})
            assertThatThrownBy(() -> NativeCodecPlatform.fromManifest(value)).hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> NativeCodecPlatform.fromManifest(null)).hasMessage("render-configuration").hasNoCause();
    }

    @Test void runtimeSelectionRequiresJava25LinuxLittleEndianAndKnownArchitecture() {
        assertThat(runtime("aarch64", "/lib/ld-musl-aarch64.so.1")).isEqualTo(NativeCodecPlatform.ARM64);
        assertThat(runtime("aarch64", "/lib/ld-linux-aarch64.so.1")).isEqualTo(NativeCodecPlatform.ARM64_GLIBC);
        for (var architecture : new String[]{"amd64", "x86_64"})
            assertThat(runtime(architecture, "/lib/ld-musl-x86_64.so.1")).isEqualTo(NativeCodecPlatform.AMD64);
        for (var architecture : new String[]{"amd64", "x86_64"})
            assertThat(runtime(architecture, "/lib64/ld-linux-x86-64.so.2")).isEqualTo(NativeCodecPlatform.AMD64_GLIBC);
        for (var architecture : new String[]{"arm64", "x86", "riscv64", "", "private-architecture"})
            assertThatThrownBy(() -> runtime(architecture, "/lib/ld-musl-x86_64.so.1"))
                .hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> NativeCodecPlatform.runtime("Mac OS X", "amd64", ByteOrder.LITTLE_ENDIAN, 25, "/lib/ld-musl-x86_64.so.1"))
            .hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> NativeCodecPlatform.runtime("Linux", "amd64", ByteOrder.BIG_ENDIAN, 25, "/lib/ld-musl-x86_64.so.1"))
            .hasMessage("render-configuration").hasNoCause();
        for (int version : new int[]{23, 24, 26})
            assertThatThrownBy(() -> NativeCodecPlatform.runtime("Linux", "amd64", ByteOrder.LITTLE_ENDIAN, version, "/lib/ld-musl-x86_64.so.1"))
                .hasMessage("render-configuration").hasNoCause();
    }

    @Test void doesNotGuessLibcFromArchitectureFilesOnDiskOrUnknownInterpreter() {
        for (var interpreter : new String[]{"", "/lib/libc.so.6", "/private/ld-linux-x86-64.so.2", "/lib/ld-musl-aarch64.so.1"})
            assertThatThrownBy(() -> runtime("amd64", interpreter)).hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> runtime("aarch64", "/lib64/ld-linux-x86-64.so.2")).hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> runtime("amd64", null)).hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> NativeCodecPlatform.AMD64_GLIBC.sharpDependencies().add("private.so"))
            .isInstanceOf(UnsupportedOperationException.class);
    }

    private static NativeCodecPlatform runtime(String architecture, String interpreter) {
        return NativeCodecPlatform.runtime("Linux", architecture, ByteOrder.LITTLE_ENDIAN, 25, interpreter);
    }

    @Test void glibcAllocatorPolicyIsFixedAndNeverInheritedByHelperOrChild() {
        for (var platform : new NativeCodecPlatform[]{NativeCodecPlatform.ARM64_GLIBC, NativeCodecPlatform.AMD64_GLIBC}) {
            assertThat(platform.childEnvironment()).containsOnlyKeys("MALLOC_ARENA_MAX").containsEntry("MALLOC_ARENA_MAX", "2");
            platform.requireParentEnvironment(Map.of("MALLOC_ARENA_MAX", "2", "IGNORED_PRIVATE", "secret"));
            for (var value : new String[]{"", "0", "3", " 2", "private-value"})
                assertThatThrownBy(() -> platform.requireParentEnvironment(Map.of("MALLOC_ARENA_MAX", value)))
                    .hasMessage("render-configuration").hasNoCause();
            assertThatThrownBy(() -> platform.requireParentEnvironment(Map.of())).hasMessage("render-configuration").hasNoCause();
        }
        assertThat(NativeCodecPlatform.ARM64.childEnvironment()).isEmpty();
        assertThat(NativeCodecPlatform.AMD64.childEnvironment()).isEmpty();
    }
}
