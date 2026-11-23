package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PageRasterReaderTest {
    @TempDir Path temporary;

    @Test
    void jdkFormatsAreReadAndWebpIsRecognisedByItsHeaderNotItsName() throws Exception {
        var png = temporary.resolve("page.webp");   // misleading name: the header decides
        var image = new BufferedImage(40, 30, BufferedImage.TYPE_INT_RGB);
        image.setRGB(5, 5, 0xff0000);
        ImageIO.write(image, "png", png.toFile());
        var read = PageRasterReader.jdkOnly().read(png);
        assertThat(read).isNotNull();
        assertThat(read.getWidth()).isEqualTo(40);
        assertThat(read.getRGB(5, 5) & 0xffffff).isEqualTo(0xff0000);
        assertThat(PageRasterReader.isWebp(png)).isFalse();

        var webp = temporary.resolve("page.png");
        Files.write(webp, new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' '});
        assertThat(PageRasterReader.isWebp(webp)).isTrue();
        // Without the pinned decoder a WebP page is unreadable (never parsed in process): callers fall back.
        assertThat(PageRasterReader.jdkOnly().read(webp)).isNull();
    }
}
