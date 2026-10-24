package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/** Explicit cached glibc targets, no acquisition/network; the independent decoder still runs on ARM64/musl. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.glibc.enabled", matches = "true")
class NativeCodecGlibcLinuxTest {
    @TempDir Path temporary;
    @BeforeAll static void currentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void actualCodecPreservesAlphaHiddenRgbOwnershipAndLimits(NativeCodecPlatform target) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("codec"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            fixture.glibcCodec(distribution(target), pin(target), staging, target == NativeCodecPlatform.AMD64_GLIBC);
        }
        assertThat(Files.readString(staging.resolve("native-platform.txt"))).isEqualTo(target.manifestId());
        var decoded = Files.createDirectory(temporary.resolve("decoded"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            fixture.decode(staging.resolve("independent-decode.webp"), decoded);
        }
        var image = ImageIO.read(decoded.resolve("decoded.png").toFile());
        try {
            assertThat(image.getWidth()).isEqualTo(320); assertThat(image.getHeight()).isEqualTo(220);
            for (int y = 0; y < 220; y++) for (int x = 0; x < 320; x++) {
                int expected = ((x + y) % 5 == 0 ? 0 : (x * 17 + y * 5) & 255) << 24
                    | ((x * 31 + y * 7) & 255) << 16 | ((x * 19 + y * 11) & 255) << 8 | (x * 13 + y * 23) & 255;
                assertThat(image.getRGB(x, y)).isEqualTo(expected);
            }
        } finally { image.flush(); }
    }

    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void guardedChildHasSameKernelConfirmedCeilingsAndNoCoreDump(NativeCodecPlatform target) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("limits"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            assertThat(fixture.glibcLimitsProbe(staging, target == NativeCodecPlatform.AMD64_GLIBC)).isZero();
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("limits.json")));
        assertThat(metrics.path("platform").textValue()).isEqualTo(target.manifestId());
        assertThat(metrics.path("oomScoreAdjustment").intValue()).isEqualTo(1000);
        assertThat(metrics.path("dumpable").intValue()).isZero();
        assertThat(metrics.path("resource-9").get(0).longValue()).isEqualTo(NativeProcessLimits.initial().addressSpaceBytes());
        assertThat(metrics.path("resource-0").get(0).longValue()).isEqualTo(120);
        assertThat(metrics.path("resource-1").get(0).longValue()).isEqualTo(64L * 1024 * 1024);
        assertThat(metrics.path("resource-4").get(1).longValue()).isZero();
        assertThat(metrics.path("resource-7").get(0).longValue()).isEqualTo(128);
        assertThat(GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("container-state.json")))
            .path("oomKilled").booleanValue()).isFalse();
    }

    static Path distribution(NativeCodecPlatform target) { return Path.of(System.getProperty(prefix(target) + ".directory")); }
    static String pin(NativeCodecPlatform target) { return System.getProperty(prefix(target) + ".sha256"); }
    private static String prefix(NativeCodecPlatform target) {
        return target == NativeCodecPlatform.ARM64_GLIBC ? "renderer.glibc.arm64" : "renderer.glibc.amd64";
    }
}
