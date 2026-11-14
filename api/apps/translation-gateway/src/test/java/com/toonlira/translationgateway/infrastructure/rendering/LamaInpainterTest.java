package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LamaInpainterTest {
    @TempDir Path dir;

    @Test
    void pasteWritesOnlyWhatTheModelChangedPlusAFeatherSoPlainPaperKeepsItsTone() {
        var page = new BufferedImage(40, 20, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < 20; y++) for (int x = 0; x < 40; x++) page.setRGB(x, y, 0xfff4f4f4); // off-white paper
        for (int x = 10; x < 14; x++) page.setRGB(x, 10, 0xff000000); // a letter stroke
        var model = new BufferedImage(40, 20, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 20; y++) for (int x = 0; x < 40; x++) model.setRGB(x, y, 0xe8e8e8); // slightly tinted output
        LamaInpainter.paste(page, model, 0, 0, 0, 0, 40, 20);
        assertThat(page.getRGB(11, 10) & 0xffffff).isEqualTo(0xe8e8e8); // stroke removed
        assertThat(page.getRGB(12, 12) & 0xffffff).isEqualTo(0xe8e8e8); // within the 2 px feather
        assertThat(page.getRGB(30, 5) & 0xffffff).isEqualTo(0xf4f4f4); // untouched paper keeps its tone
    }

    @Test
    void modelWithAnotherHashIsRefusedBeforeLoading() throws Exception {
        var fake = Files.write(dir.resolve("lama_fp32.onnx"), new byte[]{1, 2, 3});
        assertThatThrownBy(() -> new LamaInpainter(fake, 1)).isInstanceOf(IllegalStateException.class)
            .hasMessage("Inpainting model missing or invalid");
    }
}
