package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Real isolated child JVM with the real WebP command-line codec: speech over artwork is inpainted by a model that
 * runs only in this (parent) process, in two child passes. Runs where the codec is configured
 * ({@code GATEWAY_RENDERING_ENCODER_PATH}/{@code _SHA256}, {@code ..._DECODER_...}); skipped elsewhere.
 */
class IsolatedInpaintingEndToEndTest {
    @TempDir Path temporary;

    @Test
    void speechOverArtworkIsInpaintedThroughTheIsolationBoundary() throws Exception {
        var encoder = System.getenv("GATEWAY_RENDERING_ENCODER_PATH");
        var decoder = System.getenv("GATEWAY_RENDERING_DECODER_PATH");
        assumeTrue(encoder != null && decoder != null && Files.isExecutable(Path.of(encoder)) && Files.isExecutable(Path.of(decoder)));
        var settings = new RenderChildSettings(Path.of(encoder), System.getenv("GATEWAY_RENDERING_ENCODER_SHA256"),
            Path.of(decoder), System.getenv("GATEWAY_RENDERING_DECODER_SHA256"), Duration.ofSeconds(20));
        var original = temporary.resolve("page.png");
        var art = CleanBoxPainterTest.fixture(360, 220, 0xffffffff);
        for (int y = 0; y < 220; y++) for (int x = 0; x < 360; x++) if (x % 7 == 0 || y % 11 == 0) art.setRGB(x, y, 0xff000000);
        assertThat(ImageIO.write(art, "png", original.toFile())).isTrue();
        var region = new OcrManifest.Region(new UUID(0, 1), 0, "Thank you for everything", CleanBoxPainterTest.rectangle(.3, .3, .7, .7));
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(region),
            RenderPolicy.initial()).withCaptionHints(Set.of(region.id()));
        var staging = Files.createDirectory(temporary.resolve("staging"));

        var launches = new AtomicInteger();
        var model = new AtomicInteger();
        IsolatedRenderAdapter.ChildLauncher child = (directory, heap) -> {
            launches.incrementAndGet();
            return RenderJvmLauncher.builder(directory, heap, RenderChildMain.class.getName(), settings).start();
        };
        InpaintModel grey = (rgb, mask) -> {
            model.incrementAndGet();
            var out = Arrays.copyOf(rgb, rgb.length);
            for (int i = 0; i < mask.length; i++) if (mask[i] == 1) { out[i] = out[mask.length + i] = out[2 * mask.length + i] = (byte) 128; }
            return out;
        };

        var inpainting = new IsolatedRenderAdapter(staging, settings, Duration.ofSeconds(60), 128, child, () -> { }, grey);
        var output = inpainting.render(original, request);
        assertThat(launches.get()).isEqualTo(2);
        assertThat(model.get()).isEqualTo(1);
        assertThat(output.manifest().regions().getFirst().overflow()).isFalse(); // translated over rebuilt artwork
        Files.deleteIfExists(output.path());

        // Without a model: one pass, the original lettering stays, as before.
        launches.set(0);
        var plain = new IsolatedRenderAdapter(staging, settings, Duration.ofSeconds(60), 128, child, () -> { }, null);
        var kept = plain.render(original, request);
        assertThat(launches.get()).isEqualTo(1);
        assertThat(kept.manifest().regions().getFirst().overflow()).isTrue();
        Files.deleteIfExists(kept.path());
    }
}
