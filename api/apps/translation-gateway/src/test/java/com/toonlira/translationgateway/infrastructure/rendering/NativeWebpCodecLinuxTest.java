package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;

@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.shared.enabled", matches = "true")
class NativeWebpCodecLinuxTest {
    @TempDir Path root;
    @Test void exactRoundTripAndExternalDecodeMatchIndependentCliWithoutNetwork() throws Exception {
        var library = Path.of(System.getProperty("renderer.shared.directory"));
        var staging = Files.createDirectory(root.resolve("work"));
        try (var fixture = new LinuxRenderContainerFixture(root)) {
            fixture.nativeCodec(library, staging);
            var webp = staging.resolve("independent-decode.webp");
            byte[] original = Files.readAllBytes(webp);
            fixture.decode(webp, staging);
            var decoded = ImageIO.read(staging.resolve("decoded.png").toFile());
            assertThat(decoded.getWidth()).isEqualTo(320); assertThat(decoded.getHeight()).isEqualTo(220);
            for (int y = 0; y < 220; y++) for (int x = 0; x < 320; x++) {
                int expected = ((x+y)%5==0?0:(x*17+y*5)&255)<<24 | ((x*31+y*7)&255)<<16 | ((x*19+y*11)&255)<<8 | (x*13+y*23)&255;
                assertThat(decoded.getRGB(x,y)).isEqualTo(expected);
            }
            assertThat(Files.readAllBytes(webp)).isEqualTo(original);
        }
    }
}
