package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;

@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.distribution.enabled", matches = "true")
class NativeCodecDistributionLinuxTest {
    @TempDir Path temporary;
    @BeforeAll static void currentArchive() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @Test void relocatedReadonlyPackageRunsWithNoBuildMountNetworkOrSearchPathEnvironment() throws Exception {
        var directory = Path.of(System.getProperty("renderer.distribution.directory"));
        var pin = System.getProperty("renderer.distribution.sha256");
        NativeCodecDistribution.admit(directory, pin, Duration.ofSeconds(60));
        var staging = Files.createDirectory(temporary.resolve("codec"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.portableNativeCodec(directory, pin, staging); }
        var decoded = Files.createDirectory(temporary.resolve("decoded"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.decode(staging.resolve("independent-decode.webp"), decoded); }
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

    @Test void workerConfigurationSelectsSupervisorAndOnlyTheChildReceivesNativeAccess() throws Exception {
        var directory = Path.of(System.getProperty("renderer.distribution.directory"));
        var pin = System.getProperty("renderer.distribution.sha256");
        var staging = Files.createDirectory(temporary.resolve("configured"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.nativeWorkerConfiguration(directory, pin, staging); }
        var decoded = Files.createDirectory(temporary.resolve("decoded"));
        try (var fixture = new LinuxRenderContainerFixture(temporary)) { fixture.decode(staging.resolve("configured.webp"), decoded); }
        var image = ImageIO.read(decoded.resolve("decoded.png").toFile());
        try {
            assertThat(image.getWidth()).isEqualTo(13); assertThat(image.getHeight()).isEqualTo(17);
            for (int y = 0; y < 17; y++) for (int x = 0; x < 13; x++) assertThat(image.getRGB(x, y)).isEqualTo(0xffaaccee);
        } finally { image.flush(); }
    }
}
