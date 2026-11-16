package com.toonlira.translationgateway.infrastructure.layout;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.ReadingDirection;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.*;

class LocalLayoutAdapterTest {
    @TempDir Path temporary;

    @Test void disabledModeDoesNotRequireModelAndShadowFailsClosed() {
        var properties = new GatewayProperties();
        properties.getLayout().setModelPath(temporary.resolve("absent.onnx"));
        var environment = new MockEnvironment().withProperty("unused", "unused");
        environment.setActiveProfiles("worker");
        assertThat(new LayoutConfiguration().layoutPort(properties, environment).available()).isFalse();
        properties.getLayout().setMode(GatewayProperties.Layout.Mode.SHADOW);
        assertThatThrownBy(() -> new LayoutConfiguration().layoutPort(properties, environment)).hasMessageContaining("direction");
        properties.getLayout().setDirection("ltr");
        assertThatThrownBy(() -> new LayoutConfiguration().layoutPort(properties, environment)).hasMessageContaining("model");
    }

    @Test void retainsCapacityUntilNativeWorkActuallyReturnsEvenAfterDeadline() throws Exception {
        var image = temporary.resolve("image.png");
        ImageIO.write(new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB), "png", image.toFile());
        var ocr = new OcrManifest("1.0", UUID.randomUUID(), "pt-BR", 20, 20, List.of());
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var adapter = new LocalLayoutAdapter((pixels, remaining) -> {
            entered.countDown();
            try { release.await(5, TimeUnit.SECONDS); } catch (InterruptedException error) { Thread.currentThread().interrupt(); }
            return List.of();
        }, ReadingDirection.ltr, Duration.ofMillis(100), false, Duration.ofMillis(50)); var executor = Executors.newSingleThreadExecutor()) {
            var first = executor.submit(() -> adapter.analyze(image, ocr, "a".repeat(64), "b".repeat(64)));
            try {
                assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> adapter.analyze(image, ocr, "a".repeat(64), "b".repeat(64)))
                    .isInstanceOf(LayoutFailure.class).hasMessage("layout-unavailable");
                Thread.sleep(120);
                assertThatThrownBy(() -> adapter.analyze(image, ocr, "a".repeat(64), "b".repeat(64)))
                    .hasMessage("layout-unavailable");
            } finally { release.countDown(); }
            assertThatThrownBy(() -> first.get(2, TimeUnit.SECONDS)).hasCauseInstanceOf(LayoutFailure.class);
        }
    }

    @Test void aSecondPageWaitsForTheDetectorInsteadOfLosingItsBalloons() throws Exception {
        var image = temporary.resolve("image.png");
        ImageIO.write(new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB), "png", image.toFile());
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var adapter = new LocalLayoutAdapter((pixels, remaining) -> {
            entered.countDown();
            try { release.await(5, TimeUnit.SECONDS); } catch (InterruptedException error) { Thread.currentThread().interrupt(); }
            return List.of();
        }, ReadingDirection.ltr, Duration.ofSeconds(10), true, Duration.ofSeconds(5)); var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> adapter.detect(image));
            assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
            var second = executor.submit(() -> adapter.detect(image));
            Thread.sleep(100);
            assertThat(second.isDone()).isFalse(); // waiting its turn, not failed
            release.countDown();
            assertThat(first.get(2, TimeUnit.SECONDS)).isNotNull();
            assertThat(second.get(2, TimeUnit.SECONDS)).isNotNull();
        }
    }
}
