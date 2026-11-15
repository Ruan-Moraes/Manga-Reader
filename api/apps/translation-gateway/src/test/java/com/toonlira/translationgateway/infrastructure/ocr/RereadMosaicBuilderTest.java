package com.toonlira.translationgateway.infrastructure.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.application.port.RereadImagingPort;
import java.awt.Color;
import java.awt.Font;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RereadMosaicBuilderTest {
    @TempDir Path dir;

    @Test
    void rendersEveryCropInAllVariantsIntoOnePng() throws Exception {
        var page = new BufferedImage(400, 300, BufferedImage.TYPE_INT_RGB);
        var g = page.createGraphics();
        g.setColor(new Color(0xdddddd)); g.fillRect(0, 0, 400, 300); // tinted paper
        g.setColor(Color.DARK_GRAY); g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 18)); g.drawString("IS SO", 40, 60);
        g.dispose();
        var file = dir.resolve("page.png");
        ImageIO.write(page, "png", file.toFile());
        var mosaic = new RereadMosaicBuilder().build(file, List.of(new int[]{30, 40, 120, 70}, new int[]{-10, 250, 50, 400}));
        assertThat(mosaic).isNotNull();
        assertThat(mosaic.layout().tiles()).hasSize(2 * RereadImagingPort.VARIANTS).doesNotContainNull();
        var image = ImageIO.read(new ByteArrayInputStream(mosaic.png()));
        assertThat(image.getWidth()).isEqualTo(mosaic.layout().width());
        assertThat(image.getHeight()).isEqualTo(mosaic.layout().height());
        var enlarged = mosaic.layout().tiles().getFirst();
        assertThat(enlarged.width()).isEqualTo(180); // 90 px crop, 2x
        assertThat(mosaic.layout().tiles().get(1).width()).isEqualTo(270); // 3x, colour kept
        var binary = mosaic.layout().tiles().get(2); // 3x, binarized and thinned
        for (int y = binary.y(); y < binary.y() + binary.height(); y++) for (int x = binary.x(); x < binary.x() + binary.width(); x++)
            assertThat(image.getRGB(x, y) & 0xffffff).isIn(0x000000, 0xffffff);
    }

    @Test
    void unreadablePageSkipsRereading() throws Exception {
        var file = Files.writeString(dir.resolve("broken.png"), "not an image");
        assertThat(new RereadMosaicBuilder().build(file, List.<int[]>of(new int[]{0, 0, 10, 10}))).isNull();
    }

    @Test
    void bundledLexiconsCoverLatinSourcesOnly() {
        var lexicons = new ClasspathLexicons();
        assertThat(lexicons.forLanguage("en").knows("the")).isTrue();
        assertThat(lexicons.forLanguage("en").knows("pathetic")).isTrue();
        assertThat(lexicons.forLanguage("pt-BR").knows("você")).isTrue();
        assertThat(lexicons.forLanguage("es").knows("también")).isTrue();
        assertThat(lexicons.forLanguage("ja").available()).isFalse();
    }

    @Test
    void framedCropSitsOnWhiteSpaceWithoutThePageAroundIt() {
        var crop = new java.awt.image.BufferedImage(20, 40, java.awt.image.BufferedImage.TYPE_INT_RGB);
        var framed = RereadMosaicBuilder.frame(crop, com.toonlira.translationgateway.application.port.RereadImagingPort.framePad(new int[]{0, 0, 20, 40}));
        assertThat(framed.getWidth()).isEqualTo(60);
        assertThat(framed.getHeight()).isEqualTo(80);
        assertThat(framed.getRGB(0, 0) & 0xffffff).isEqualTo(0xffffff);
        assertThat(framed.getRGB(30, 40) & 0xffffff).isZero(); // the crop itself (black) in the middle
    }
}
