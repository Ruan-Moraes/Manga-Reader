package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;

/** Explicit cached AMD64 proof; ARM64 decoder independently checks portable WebP output. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.amd64.enabled", matches = "true")
class NativeCodecAmd64LinuxTest {
    @TempDir Path temporary;
    @BeforeAll static void currentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @Test void amd64RelocatedCodecPreservesAlphaAndHiddenRgbWithoutNetwork() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("amd64-codec"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            fixture.portableAmd64Codec(distribution(), pin(), staging);
        }
        assertThat(Files.readString(staging.resolve("native-platform.txt"))).isEqualTo("linux-x86_64-musl");
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

    @Test void amd64WorkerBeanStartsSupervisorAndGuardedChildWithoutParentNativeAccess() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("amd64-worker-bean"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            fixture.amd64WorkerConfiguration(distribution(), pin(), staging);
        }
        assertThat(Files.readString(staging.resolve("native-platform.txt"))).isEqualTo("linux-x86_64-musl");
        var decoded = Files.createDirectory(temporary.resolve("decoded"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            fixture.decode(staging.resolve("configured.webp"), decoded);
        }
        var image = ImageIO.read(decoded.resolve("decoded.png").toFile());
        try {
            assertThat(image.getWidth()).isEqualTo(13); assertThat(image.getHeight()).isEqualTo(17);
            for (int y = 0; y < 17; y++) for (int x = 0; x < 13; x++) assertThat(image.getRGB(x, y)).isEqualTo(0xffaaccee);
        } finally { image.flush(); }
    }

    @Test void amd64KernelConfirmsSameSelfOnlyProcessCeilings() throws Exception {
        var staging = Files.createDirectory(temporary.resolve("amd64-guard"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            assertThat(fixture.amd64LimitsProbe(staging)).isZero();
        }
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("limits.json")));
        assertThat(metrics.path("platform").textValue()).isEqualTo("linux-x86_64-musl");
        assertThat(metrics.path("oomScoreAdjustment").intValue()).isEqualTo(1000);
        assertThat(metrics.path("dumpable").isIntegralNumber()).isTrue();
        assertThat(metrics.path("dumpable").intValue()).isZero();
        assertThat(metrics.path("resource-9").get(0).longValue()).isEqualTo(NativeProcessLimits.initial().addressSpaceBytes());
        assertThat(metrics.path("resource-0").get(0).longValue()).isEqualTo(120);
        assertThat(metrics.path("resource-1").get(0).longValue()).isEqualTo(64L * 1024 * 1024);
        assertThat(metrics.path("resource-4").get(1).longValue()).isZero();
        assertThat(metrics.path("resource-7").get(0).longValue()).isEqualTo(128);
        assertThat(GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("container-state.json")))
            .path("oomKilled").booleanValue()).isFalse();
    }

    private static Path distribution() { return Path.of(System.getProperty("renderer.amd64.distribution.directory")); }
    private static String pin() { return System.getProperty("renderer.amd64.distribution.sha256"); }
}
