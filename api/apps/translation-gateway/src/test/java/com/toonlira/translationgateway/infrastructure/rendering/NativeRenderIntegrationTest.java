package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class NativeRenderIntegrationTest {
    @TempDir Path temporary;

    @Test void nativeSettingsAreExplicitAndPrivateIpcNeverFallsBackToCli() throws Exception {
        var settings = settings();
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 42, 32, 22, "a".repeat(64)),
            List.of(), RenderPolicy.initial());
        var file = temporary.resolve("request.bin");
        RenderSubprocessProtocol.writeRequest(file, temporary.resolve("original.png"), settings, request);
        var decoded = RenderSubprocessProtocol.readRequest(file);
        assertThat(decoded.settings()).isEqualTo(settings);
        assertThat(decoded.settings()).isInstanceOf(NativeRenderChildSettings.class);
        assertThat(decoded.request().source()).isEqualTo(request.source());
        assertThat(decoded.settings().toString()).isEqualTo("NativeRenderChildSettings[redacted]");
        var bytes = Files.readAllBytes(file);
        ByteBuffer.wrap(bytes).putInt(0, 0x54524e39);
        Files.write(file, bytes);
        assertThatThrownBy(() -> RenderSubprocessProtocol.readRequest(file))
            .hasMessage("render-unavailable").hasNoCause();
    }

    @Test void nativeAccessIsOnlyGrantedForAnExplicitNativeChild() throws Exception {
        var ordinary = RenderJvmLauncher.builder(temporary, 64, RenderChildMain.class.getName());
        var nativeChild = RenderJvmLauncher.builder(temporary, 64, RenderChildMain.class.getName(), true);
        assertThat(ordinary.command()).doesNotContain("--enable-native-access=ALL-UNNAMED");
        assertThat(nativeChild.command()).contains("--enable-native-access=ALL-UNNAMED");
        assertThat(nativeChild.environment()).isEmpty();
        assertThat(nativeChild.command()).doesNotContain("sh", "bash", "gs://", settings().library().toString());
    }

    @Test void guardedNativeHasItsOwnIpcVersionAndControlledVirtualReservations() throws Exception {
        var bounded = new BoundedNativeRenderChildSettings(settings(), NativeProcessLimits.initial());
        var request = LocalFileRenderAdapterTest.request(new RenderSource("image/png", 42, 32, 22, "a".repeat(64)),
            List.of(), RenderPolicy.initial());
        var file = temporary.resolve("bounded.bin");
        RenderSubprocessProtocol.writeRequest(file, temporary.resolve("original.png"), bounded, request);
        assertThat(ByteBuffer.wrap(Files.readAllBytes(file)).getInt()).isEqualTo(0x54524e33);
        assertThat(RenderSubprocessProtocol.readRequest(file).settings()).isEqualTo(bounded);
        assertThat(bounded.toString()).isEqualTo("BoundedNativeRenderChildSettings[redacted]");
        var process = RenderJvmLauncher.builder(temporary, 256, RenderChildMain.class.getName(), bounded);
        assertThat(process.command()).contains("--enable-native-access=ALL-UNNAMED", "-XX:+UseSerialGC",
            "-XX:MaxMetaspaceSize=96m", "-XX:CompressedClassSpaceSize=32m", "-XX:ReservedCodeCacheSize=64m",
            "-XX:MaxDirectMemorySize=384m", "-XX:ActiveProcessorCount=1", "-XX:-CreateCoredumpOnCrash",
            "-XX:ErrorFile=/dev/null");
        assertThat(process.environment()).isEmpty();
        assertThatThrownBy(() -> RenderJvmLauncher.builder(temporary, 513, RenderChildMain.class.getName(), bounded))
            .hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> new BoundedNativeRenderChildSettings(null, NativeProcessLimits.initial()))
            .hasMessage("render-configuration").hasNoCause();
        assertThatThrownBy(() -> new BoundedNativeRenderChildSettings(settings(), null))
            .hasMessage("render-configuration").hasNoCause();
    }

    @Test void settingsRejectUnpinnedOrRelativeLibrariesAndUnboundedTimeWithoutLoadingNativeCode() {
        for (var path : new Path[] {null, Path.of("private-relative")}) {
            assertThatThrownBy(() -> new NativeRenderChildSettings(path, "a".repeat(64), temporary.resolve("sharp"),
                "b".repeat(64), Duration.ofSeconds(1))).hasMessage("render-configuration").hasNoCause();
        }
        for (var timeout : new Duration[] {Duration.ZERO, Duration.ofSeconds(-1), Duration.ofSeconds(61)}) {
            assertThatThrownBy(() -> new NativeRenderChildSettings(temporary.resolve("webp"), "a".repeat(64),
                temporary.resolve("sharp"), "b".repeat(64), timeout)).hasMessage("render-configuration").hasNoCause();
        }
        assertThatThrownBy(() -> new NativeRenderChildSettings(temporary.resolve("webp"), "private-token",
            temporary.resolve("sharp"), "b".repeat(64), Duration.ofSeconds(1)))
            .hasMessage("render-configuration").hasNoCause();
    }

    private NativeRenderChildSettings settings() {
        return new NativeRenderChildSettings(temporary.resolve("libwebp.so"), "a".repeat(64),
            temporary.resolve("libsharpyuv.so"), "b".repeat(64), Duration.ofSeconds(60));
    }
}
