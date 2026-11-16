package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class InpaintExchangeTest {
    private static final BundledRenderingFonts FONTS = new BundledRenderingFonts();
    @TempDir Path dir;

    /** A model that rebuilds the masked area as flat mid-grey (enough to be told apart from the art). */
    private static final InpaintModel GREY = (rgb, mask) -> {
        var out = Arrays.copyOf(rgb, rgb.length);
        int plane = InpaintWindow.MASK_BYTES;
        for (int i = 0; i < plane; i++) if (mask[i] == 1) { out[i] = (byte) 128; out[plane + i] = (byte) 128; out[2 * plane + i] = (byte) 128; }
        return out;
    };

    @Test
    void twoIsolatedPassesGiveTheSamePageAsInProcessInpainting() throws Exception {
        var request = PageRasterPainterTest.request("pt-BR", "Obrigado por tudo", CleanBoxPainterTest.rectangle(.3, .3, .7, .7))
            .withCaptionHints(Set.of(new UUID(0, 1)));
        // In process: window, model and write-back in one painter.
        var direct = art();
        Inpainter local = (image, box) -> {
            var window = InpaintWindow.prepare(image, box);
            if (window == null) return false;
            window.apply(image, GREY.run(window.rgb(), window.mask()));
            return true;
        };
        var expected = new PageRasterPainter(FONTS, local).paint(direct, request);

        // Child pass 1: records the window, keeps the original lettering (complete fallback).
        var recorder = new InpaintExchange.Recorder();
        var first = art();
        assertThat(new PageRasterPainter(FONTS, recorder).paint(first, request).getFirst().overflow()).isTrue();
        assertThat(recorder.windows()).hasSize(1);
        InpaintExchange.writeWindows(dir.resolve(InpaintExchange.REQUEST), recorder.windows());

        // Parent: model on the numeric windows only.
        var calls = new AtomicInteger();
        assertThat(InpaintExchange.answer(dir, (rgb, mask) -> { calls.incrementAndGet(); return GREY.run(rgb, mask); }, () -> true)).isTrue();
        assertThat(calls.get()).isEqualTo(1);

        // Child pass 2: same windows in the same order, answers applied.
        var windows = InpaintExchange.readWindows(dir.resolve(InpaintExchange.REQUEST));
        var replay = new InpaintExchange.Replayer(windows, InpaintExchange.readPatches(dir.resolve(InpaintExchange.PATCHES), windows.size()));
        var second = art();
        var placements = new PageRasterPainter(FONTS, replay).paint(second, request);
        assertThat(placements).isEqualTo(expected);
        for (int y = 0; y < second.getHeight(); y++) for (int x = 0; x < second.getWidth(); x++)
            assertThat(second.getRGB(x, y)).as("(%d,%d)", x, y).isEqualTo(direct.getRGB(x, y));
    }

    @Test
    void nothingToInpaintOrAModelFailureKeepsTheOriginalLettering() throws Exception {
        assertThat(InpaintExchange.answer(dir, GREY, () -> true)).isFalse(); // no request: first result is final
        var request = PageRasterPainterTest.request("pt-BR", "Obrigado por tudo", CleanBoxPainterTest.rectangle(.3, .3, .7, .7))
            .withCaptionHints(Set.of(new UUID(0, 1)));
        var recorder = new InpaintExchange.Recorder();
        new PageRasterPainter(FONTS, recorder).paint(art(), request);
        InpaintExchange.writeWindows(dir.resolve(InpaintExchange.REQUEST), recorder.windows());
        assertThat(InpaintExchange.answer(dir, (rgb, mask) -> { throw new IllegalStateException("model down"); }, () -> true)).isTrue();
        var windows = InpaintExchange.readWindows(dir.resolve(InpaintExchange.REQUEST));
        var replay = new InpaintExchange.Replayer(windows, InpaintExchange.readPatches(dir.resolve(InpaintExchange.PATCHES), 1));
        var page = art();
        assertThat(new PageRasterPainter(FONTS, replay).paint(page, request).getFirst().overflow()).isTrue();
        assertThat(sameAs(page, art())).isTrue();
    }

    @Test
    void tamperedOrOversizedExchangeFilesAreRejected() throws Exception {
        var request = dir.resolve(InpaintExchange.REQUEST);
        Files.write(request, new byte[]{1, 2, 3});
        assertThatThrownBy(() -> InpaintExchange.readWindows(request)).isInstanceOf(IOException.class);
        // A mask value other than 0/1 is refused.
        var window = InpaintWindow.prepare(art(), new int[]{100, 60, 200, 140});
        var mask = window.mask().clone();
        mask[0] = 7;
        Files.delete(request);
        InpaintExchange.writeWindows(request, java.util.List.of(new InpaintWindow(window.wx(), window.wy(), window.side(),
            window.left(), window.top(), window.right(), window.bottom(), window.rgb(), mask, null, null)));
        assertThatThrownBy(() -> InpaintExchange.readWindows(request)).isInstanceOf(IOException.class);
        // Patches for a different number of windows are refused.
        var patches = dir.resolve(InpaintExchange.PATCHES);
        InpaintExchange.writePatches(patches, java.util.List.of(new byte[InpaintWindow.RGB_BYTES]));
        assertThatThrownBy(() -> InpaintExchange.readPatches(patches, 2)).isInstanceOf(IOException.class);
        // The parent stops at its deadline.
        Files.delete(request);
        InpaintExchange.writeWindows(request, java.util.List.of(window));
        Files.delete(patches);
        assertThatThrownBy(() -> InpaintExchange.answer(dir, GREY, () -> false)).isInstanceOf(IOException.class);
    }

    private static BufferedImage art() {
        var image = CleanBoxPainterTest.fixture(360, 220, 0xffffffff);
        for (int y = 0; y < 220; y++) for (int x = 0; x < 360; x++) if (x % 7 == 0 || y % 11 == 0) image.setRGB(x, y, 0xff000000);
        return image;
    }

    private static boolean sameAs(BufferedImage a, BufferedImage b) {
        for (int y = 0; y < a.getHeight(); y++) for (int x = 0; x < a.getWidth(); x++) if (a.getRGB(x, y) != b.getRGB(x, y)) return false;
        return true;
    }
}
