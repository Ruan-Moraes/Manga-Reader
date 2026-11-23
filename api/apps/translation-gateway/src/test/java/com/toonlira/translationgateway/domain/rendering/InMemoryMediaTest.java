package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.Arrays;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

class InMemoryMediaTest {
    @Test void inspectsActualPngAndJpegWithoutTemporaryFiles() throws Exception {
        for (var format : new String[]{"png", "jpeg"}) {
            var output = new ByteArrayOutputStream();
            ImageIO.write(new BufferedImage(32, 16, BufferedImage.TYPE_INT_RGB), format, output);
            var media = InMemoryMedia.inspect(output.toByteArray(), RenderPolicy.initial());
            assertThat(media.widthPx()).isEqualTo(32);
            assertThat(media.heightPx()).isEqualTo(16);
            assertThat(media.mimeType()).isEqualTo("image/" + format);
            assertThat(media.sha256()).hasSize(64);
        }
    }

    @Test void rejectsTruncationAnimationAndDimensionBombBeforeDecode() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", output);
        var valid = output.toByteArray();
        assertThatThrownBy(() -> InMemoryMedia.inspect(Arrays.copyOf(valid, 25), RenderPolicy.initial()))
            .isInstanceOf(RenderValidationException.class);
        var bomb = valid.clone();
        ByteBuffer.wrap(bomb).putInt(16, 100_000);
        assertThatThrownBy(() -> InMemoryMedia.inspect(bomb, RenderPolicy.initial()))
            .isInstanceOf(RenderValidationException.class);
        var animated = valid.clone();
        System.arraycopy(new byte[]{'a','c','T','L'}, 0, animated, 37, 4);
        assertThatThrownBy(() -> InMemoryMedia.inspect(animated, RenderPolicy.initial()))
            .isInstanceOf(RenderValidationException.class);
    }

    @Test void rejectsInvalidRiffLengthsAndUnknownContainers() {
        assertThatThrownBy(() -> InMemoryMedia.inspect(new byte[40], RenderPolicy.initial()))
            .isInstanceOf(RenderValidationException.class);
        var riff = new byte[30];
        System.arraycopy("RIFF".getBytes(), 0, riff, 0, 4);
        System.arraycopy("WEBPVP8L".getBytes(), 0, riff, 8, 8);
        riff[20] = 0x2f;
        assertThatThrownBy(() -> InMemoryMedia.inspect(riff, RenderPolicy.initial()))
            .isInstanceOf(RenderValidationException.class);
    }
}
