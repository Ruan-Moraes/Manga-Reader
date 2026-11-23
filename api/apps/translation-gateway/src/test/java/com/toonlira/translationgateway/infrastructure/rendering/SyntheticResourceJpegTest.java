package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class SyntheticResourceJpegTest {
    @TempDir Path temporary;

    @Test void writesRealRgbJpegWithExactDimensionsAndDoesNotOverwriteTheOwnedDestination() throws Exception {
        var file = temporary.resolve("fixture.jpeg");
        SyntheticResourceJpeg.write(file, 129, 97);
        var bytes = Files.readAllBytes(file);
        assertThat(bytes[0] & 255).isEqualTo(255); assertThat(bytes[1] & 255).isEqualTo(216);
        try (var input = ImageIO.createImageInputStream(file.toFile())) {
            var reader = ImageIO.getImageReaders(input).next();
            try { reader.setInput(input); assertThat(reader.getWidth(0)).isEqualTo(129); assertThat(reader.getHeight(0)).isEqualTo(97); }
            finally { reader.dispose(); }
        }
        assertThat(ImageIO.read(file.toFile()).getColorModel().getNumColorComponents()).isEqualTo(3);
        assertThatThrownBy(() -> SyntheticResourceJpeg.write(file, 129, 97)).hasMessage("synthetic-resource-jpeg-invalid");
        assertThat(Files.readAllBytes(file)).containsExactly(bytes);
    }

    @Test void rejectsUnacceptedDimensionsBeforeCreatingFilesOrAllocatingAnImage() {
        for (int[] dimensions : new int[][] {{0, 1}, {1, 0}, {12001, 1}, {1, 12001}, {10000, 8001}}) {
            var file = temporary.resolve("invalid-" + dimensions[0] + "-" + dimensions[1]);
            assertThatThrownBy(() -> SyntheticResourceJpeg.write(file, dimensions[0], dimensions[1]))
                .hasMessage("synthetic-resource-jpeg-invalid");
            assertThat(file).doesNotExist();
        }
    }
}
