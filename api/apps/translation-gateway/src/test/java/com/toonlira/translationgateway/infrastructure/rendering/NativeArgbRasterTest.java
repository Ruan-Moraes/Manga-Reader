package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static java.lang.foreign.ValueLayout.JAVA_INT;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class NativeArgbRasterTest {
    @Test
    void imageDataBufferSegmentAndSubimageShareOneNativeArgbAllocation() {
        try (var surface = new NativeArgbRaster(13, 17, RenderPolicy.initial())) {
            var image = surface.image();
            var pixels = surface.pixels();
            assertThat(pixels.isNative()).isTrue();
            assertThat(pixels.byteSize()).isEqualTo(13L * 17 * Integer.BYTES);
            assertThat(pixels.address() % Integer.BYTES).isZero();
            assertThat(image.getRaster().getDataBuffer()).isNotInstanceOf(DataBufferInt.class);
            assertThat(image.getRGB(0, 0)).isZero();
            image.setRGB(2, 3, 0x7fa9c3e5);
            assertThat(pixels.getAtIndex(JAVA_INT, 3 * 13 + 2)).isEqualTo(0x7fa9c3e5);
            pixels.setAtIndex(JAVA_INT, 4 * 13 + 5, 0x00123456);
            assertThat(image.getRGB(5, 4)).isEqualTo(0x00123456);
            var child = image.getSubimage(2, 3, 4, 5);
            assertThat(child.getRaster().getDataBuffer()).isSameAs(image.getRaster().getDataBuffer());
            child.setRGB(0, 0, 0xff010203);
            assertThat(pixels.getAtIndex(JAVA_INT, 3 * 13 + 2)).isEqualTo(0xff010203);
            assertThat(image.getRGB(2, 3)).isEqualTo(0xff010203);
            assertThat(NativeArgbRaster.isView(image)).isTrue();
            assertThat(NativeArgbRaster.isView(new BufferedImage(13, 17, BufferedImage.TYPE_4BYTE_ABGR))).isFalse();
            assertThat(surface.toString()).isEqualTo("NativeArgbRaster[redacted]");
        }
    }

    @Test
    void rowAccessPreservesChannelsAlphaAndHiddenTransparentRgbWithoutPageArray() {
        try (var surface = new NativeArgbRaster(5, 2, RenderPolicy.initial())) {
            int[] row = {0x00123456, 0x01112233, 0x7faabbcc, 0xff000000, 0xffffffff};
            surface.image().setRGB(0, 1, row.length, 1, row, 0, row.length);
            int[] read = new int[row.length];
            assertThat(surface.image().getRGB(0, 1, row.length, 1, read, 0, row.length)).isSameAs(read);
            assertThat(read).containsExactly(row);
            for (int x = 0; x < row.length; x++) assertThat(surface.pixels().getAtIndex(JAVA_INT, 5 + x)).isEqualTo(row[x]);
            var data = surface.image().getRaster().getDataBuffer();
            assertThatThrownBy(() -> data.getElem(-1)).isInstanceOf(IndexOutOfBoundsException.class);
            assertThatThrownBy(() -> data.setElem(10, 1)).isInstanceOf(IndexOutOfBoundsException.class);
            assertThatThrownBy(() -> data.getElem(1, 0)).isInstanceOf(IndexOutOfBoundsException.class);
            assertThatThrownBy(() -> data.setElem(-1, 0, 1)).isInstanceOf(IndexOutOfBoundsException.class);
            assertThat(surface.image().getRGB(0, 1)).isEqualTo(row[0]);
        }
    }

    @Test
    void explicitCloseInvalidatesAllAliasesAndRepeatedOwnerCloseIsSafe() {
        var surface = new NativeArgbRaster(13, 17, RenderPolicy.initial());
        var image = surface.image();
        var data = image.getRaster().getDataBuffer();
        var pixels = surface.pixels();
        surface.close();
        surface.close();
        assertThat(pixels.scope().isAlive()).isFalse();
        assertThat(NativeArgbRaster.isView(image)).isFalse();
        assertThatThrownBy(surface::image).isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        assertThatThrownBy(surface::pixels).isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        assertThatThrownBy(() -> data.getElem(0)).isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        assertThatThrownBy(() -> image.setRGB(0, 0, 1)).isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        assertThatThrownBy(() -> pixels.getAtIndex(JAVA_INT, 0)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void foreignThreadCannotReadWriteOrCloseButOwnerRemainsUsable() throws Exception {
        try (var surface = new NativeArgbRaster(13, 17, RenderPolicy.initial());
             var executor = Executors.newSingleThreadExecutor()) {
            var image = surface.image();
            image.setRGB(0, 0, 0xff123456);
            var future = executor.submit(() -> {
                for (Runnable action : new Runnable[] {surface::image, surface::pixels, surface::close,
                        () -> image.getRGB(0, 0), () -> image.setRGB(0, 0, 0)}) {
                    assertThatThrownBy(action::run).isInstanceOf(RenderFileException.class)
                        .hasMessage("render-unavailable").hasNoCause();
                }
            });
            future.get(5, TimeUnit.SECONDS);
            assertThat(surface.image().getRGB(0, 0)).isEqualTo(0xff123456);
            assertThat(surface.pixels().scope().isAlive()).isTrue();
        }
    }

    @ParameterizedTest
    @CsvSource({"0,1", "1,0", "-1,1", "12001,1", "1,12001", "10000,8001", "2147483647,2147483647"})
    void rejectsDimensionsBeforeAllocation(int width, int height) {
        assertThatThrownBy(() -> new NativeArgbRaster(width, height, RenderPolicy.initial()))
            .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
    }

    @Test
    void rejectsAbsentPolicyAndAnAlreadyInterruptedCallBeforeAllocation() {
        assertThatThrownBy(() -> new NativeArgbRaster(1, 1, null)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-invalid-media").hasNoCause();
        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> new NativeArgbRaster(1, 1, RenderPolicy.initial()))
                .isInstanceOf(RenderFileException.class).hasMessage("render-cancelled").hasNoCause();
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally { Thread.interrupted(); }
    }
}
