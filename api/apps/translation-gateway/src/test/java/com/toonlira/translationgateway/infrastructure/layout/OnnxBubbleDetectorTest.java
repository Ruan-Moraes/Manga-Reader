package com.toonlira.translationgateway.infrastructure.layout;

import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.PixelImage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.assertj.core.api.Assertions.*;

class OnnxBubbleDetectorTest {
    @TempDir Path temporary;

    @Test void rejectsMissingAndModifiedModelBeforeNativeInitialization() throws Exception {
        assertThatThrownBy(() -> new OnnxBubbleDetector(temporary.resolve("missing.onnx")))
            .isInstanceOf(IllegalStateException.class).hasMessage("Layout model missing or invalid");
        var modified = temporary.resolve("modified.onnx");
        Files.writeString(modified, "not a model");
        assertThatThrownBy(() -> new OnnxBubbleDetector(modified)).isInstanceOf(IllegalStateException.class);
    }

    @Test void scalesRgbChannelsWithoutNormalization() {
        var pixels = new PixelImage() {
            public int width() { return 1; }
            public int height() { return 1; }
            public int rgb(int x, int y) { return 0xff8000; }
        };
        var result = OnnxBubbleDetector.resize(pixels);
        assertThat(result).hasSize(3 * 640 * 640);
        assertThat(result[0]).isEqualTo(1);
        assertThat(result[640 * 640]).isEqualTo(128f / 255);
        assertThat(result[2 * 640 * 640]).isZero();
    }

    @Test void filtersClassesAndThresholdWithoutTruncatingOrClamping() {
        var result = OnnxBubbleDetector.decode(new long[][]{{0, 1, 2, 0}},
            new float[][][]{{{10, 20, 50, 80}, {10, 20, 50, 80}, {10, 20, 50, 80}, {10, 20, 50, 80}}},
            new float[][]{{.5f, .9f, .9f, .49f}}, 100, 200);
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().id()).isEqualTo("bubble-0");
        assertThat(result.getFirst().bounds().bottom()).isCloseTo(.4, within(1e-6));
        assertThatThrownBy(() -> OnnxBubbleDetector.decode(new long[][]{{0}}, new float[][][]{{{-1, 0, 10, 10}}},
            new float[][]{{.9f}}, 100, 200)).isInstanceOf(LayoutFailure.class);
        assertThatThrownBy(() -> OnnxBubbleDetector.decode(new long[][]{{0}}, new float[][][]{{{1, 0, 10, 10}}},
            new float[][]{{Float.NaN}}, 100, 200)).isInstanceOf(LayoutFailure.class);
        var labels = new long[][]{new long[257]};
        var boxes = new float[1][257][4];
        var scores = new float[1][257];
        for (int i = 0; i < 257; i++) { boxes[0][i] = new float[]{1, 1, 10, 10}; scores[0][i] = .9f; }
        assertThatThrownBy(() -> OnnxBubbleDetector.decode(labels, boxes, scores, 100, 100))
            .hasMessage("layout-limit-exceeded");
    }

    @Test void onnxExporterReceivesWidthThenHeightForNonSquareImages() {
        var image = new PixelImage() {
            public int width() { return 200; }
            public int height() { return 400; }
            public int rgb(int x, int y) { return 0; }
        };
        assertThat(OnnxBubbleDetector.targetSizes(image)[0]).containsExactly(200, 400);
        var bubbles = OnnxBubbleDetector.decode(new long[][]{{0}}, new float[][][]{{{20, 80, 100, 240}}},
            new float[][]{{.9f}}, image.width(), image.height());
        assertThat(bubbles.getFirst().bounds().left()).isCloseTo(.1, within(1e-6));
        assertThat(bubbles.getFirst().bounds().top()).isCloseTo(.2, within(1e-6));
        assertThat(bubbles.getFirst().bounds().bottom()).isCloseTo(.6, within(1e-6));
    }
}
