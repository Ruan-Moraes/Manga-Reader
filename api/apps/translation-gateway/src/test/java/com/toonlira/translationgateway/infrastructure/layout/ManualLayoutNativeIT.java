package com.toonlira.translationgateway.infrastructure.layout;

import com.toonlira.translationgateway.domain.layout.PixelImage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import java.nio.file.Path;
import java.time.Duration;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Explicit model check only; ordinary tests never acquire or require weights. */
@EnabledIfEnvironmentVariable(named = "OCR_LAYOUT_MODEL", matches = ".+")
class ManualLayoutNativeIT {
    @Test void nativeCancellationTerminatesAndFreshRunOptionsRemainUsable() {
        PixelImage white = new PixelImage() {
            public int width() { return 200; }
            public int height() { return 400; }
            public int rgb(int x, int y) { return 0xffffff; }
        };
        try (var detector = new OnnxBubbleDetector(Path.of(System.getenv("OCR_LAYOUT_MODEL")))) {
            assertThatThrownBy(() -> detector.detect(white, Duration.ofNanos(1))).hasMessage("layout-timeout");
            assertThatCode(() -> detector.detect(white, Duration.ofSeconds(30))).doesNotThrowAnyException();
        }
    }
}
