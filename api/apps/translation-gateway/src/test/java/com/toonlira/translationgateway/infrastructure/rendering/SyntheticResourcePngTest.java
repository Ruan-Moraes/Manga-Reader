package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Path;
import java.util.HashSet;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class SyntheticResourcePngTest {
    @TempDir Path temporary;

    @Test
    void multicolorFixtureHasMoreThanPaletteCapacityAndPreservesExactFormula() throws Exception {
        var path = SyntheticResourcePng.multicolor(temporary.resolve("multicolor.png"), 320, 220);
        var image = ImageIO.read(path.toFile());
        var colors = new HashSet<Integer>();
        try {
            for (int y = 0; y < 220; y++) for (int x = 0; x < 320; x++) {
                int expected = 0xff000000 | (x & 255) << 16 | (y & 255) << 8 | ((x + y) & 255);
                assertThat(image.getRGB(x, y)).isEqualTo(expected);
                colors.add(expected);
            }
            assertThat(colors.size()).isGreaterThan(256);
        } finally { image.flush(); }
        var second = SyntheticResourcePng.multicolor(temporary.resolve("multicolor-copy.png"), 320, 220);
        assertThat(Files.readAllBytes(path)).containsExactly(Files.readAllBytes(second));
    }

    @Test
    void streamingFixtureIsARealRgbPngAndNoiseIsDeterministic() throws Exception {
        var original = SyntheticResourcePng.write(temporary.resolve("flat.png"), 24, 12, false);
        var image = ImageIO.read(original.toFile());
        try {
            assertThat(image.getWidth()).isEqualTo(24);
            assertThat(image.getHeight()).isEqualTo(12);
            for (int y = 0; y < 12; y++) for (int x = 0; x < 24; x++) assertThat(image.getRGB(x, y)).isEqualTo(0xffcccccc);
        } finally { image.flush(); }
        var first = SyntheticResourcePng.write(temporary.resolve("first.png"), 24, 12, true);
        var second = SyntheticResourcePng.write(temporary.resolve("second.png"), 24, 12, true);
        assertThat(Files.readAllBytes(first)).containsExactly(Files.readAllBytes(second));
        var noise = ImageIO.read(first.toFile());
        try { assertThat(noise.getRGB(0, 0)).isNotEqualTo(noise.getRGB(1, 0)); }
        finally { noise.flush(); }
    }

    @Test
    void fixtureNeverOverwritesExistingBytesOrAcceptsAboveTheMediaDimensions() throws Exception {
        var path = Files.writeString(temporary.resolve("existing.png"), "sentinel");
        assertThatThrownBy(() -> SyntheticResourcePng.write(path, 10, 10, false)).isInstanceOf(FileAlreadyExistsException.class);
        assertThat(Files.readString(path)).isEqualTo("sentinel");
        assertThatThrownBy(() -> SyntheticResourcePng.write(temporary.resolve("large.png"), 12_000, 12_000, false))
            .hasMessage("synthetic-resource-png-invalid");
        assertThat(temporary.resolve("large.png")).doesNotExist();
    }
}
