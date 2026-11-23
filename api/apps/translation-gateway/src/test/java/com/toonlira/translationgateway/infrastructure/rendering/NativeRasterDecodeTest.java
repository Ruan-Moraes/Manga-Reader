package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static java.lang.foreign.ValueLayout.JAVA_INT;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import javax.imageio.ImageIO;
import javax.imageio.ImageTypeSpecifier;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class NativeRasterDecodeTest {
    private static final int WIDTH = 13, HEIGHT = 17;
    @TempDir Path temporary;
    private final WebpProcessCodec codec = mock(WebpProcessCodec.class);
    private final MediaInspectionService inspector = new MediaInspectionService();

    @ParameterizedTest
    @ValueSource(ints = {BufferedImage.TYPE_INT_ARGB, BufferedImage.TYPE_INT_RGB, BufferedImage.TYPE_4BYTE_ABGR,
        BufferedImage.TYPE_BYTE_GRAY, BufferedImage.TYPE_USHORT_GRAY, BufferedImage.TYPE_BYTE_INDEXED,
        BufferedImage.TYPE_BYTE_BINARY})
    void pngDecodesDirectlyIntoTheProvidedNativeBuffer(int type) throws Exception {
        verifyDecode(fixture("png", type));
    }

    @ParameterizedTest
    @ValueSource(ints = {BufferedImage.TYPE_INT_RGB, BufferedImage.TYPE_BYTE_GRAY})
    void jpegDecodesDirectlyIntoTheProvidedNativeBuffer(int type) throws Exception {
        verifyDecode(fixture("jpeg", type));
    }

    @Test
    void bridgeSharesNativeDataAndConvertsSourcePixelsWithoutAnotherPage() {
        try (var surface = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            var source = new BufferedImage(1, 1, BufferedImage.TYPE_USHORT_GRAY);
            source.setRGB(0, 0, 0xff123456);
            var buffer = surface.image().getRaster().getDataBuffer();
            var bridge = new ArgbDecodeDestination(ImageTypeSpecifier.createFromRenderedImage(source), WIDTH, HEIGHT, buffer);
            bridge.destination().getRaster().setPixel(2, 3, source.getRaster().getPixel(0, 0, (int[]) null));
            assertThat(bridge.argbView().getRaster().getDataBuffer()).isSameAs(buffer);
            assertThat(surface.image().getRGB(2, 3)).isEqualTo(source.getRGB(0, 0));
            surface.image().setRGB(2, 3, 0x00123456);
            assertThat(bridge.destination().getRGB(2, 3)).isEqualTo(0x00123456);
        }
    }

    @Test
    void rejectsMismatchedClosedOrAbsentDestinationWithoutUsingCodec() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        var media = inspect(file);
        try (var wrong = new NativeArgbRaster(WIDTH - 1, HEIGHT, RenderPolicy.initial());
             var closed = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            closed.close();
            assertThatThrownBy(() -> decoder().decodeInto(media, RenderPolicy.initial(), wrong))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
            assertThatThrownBy(() -> decoder().decodeInto(media, RenderPolicy.initial(), null))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
            assertThatThrownBy(() -> decoder().decodeInto(media, RenderPolicy.initial(), closed))
                .isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        } finally { inspector.deleteQuietly(media.path()); }
        verifyNoInteractions(codec);
    }

    @Test
    void truncationOrDivergentDimensionsCannotProduceSuccessfulDecode() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        var media = inspect(file);
        var before = Files.readAllBytes(file);
        var wrong = new MediaInspectionService.InspectedMedia(media.path(), media.mimeType(), media.byteSize(),
            WIDTH - 1, HEIGHT, media.sha256());
        try (var surface = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            assertThatThrownBy(() -> decoder().decodeInto(wrong, RenderPolicy.initial(), surface))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
            Files.write(media.path(), Arrays.copyOf(Files.readAllBytes(media.path()), 40));
            assertThatThrownBy(() -> decoder().decodeInto(media, RenderPolicy.initial(), surface))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
            assertThat(Files.readAllBytes(file)).containsExactly(before);
        } finally { inspector.deleteQuietly(media.path()); }
        verifyNoInteractions(codec);
    }

    @Test
    void interruptedDecodePreservesTheFlagAndDoesNotUseCodecOrClearDestination() throws Exception {
        var media = inspect(fixture("png", BufferedImage.TYPE_INT_ARGB));
        try (var surface = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            surface.image().setRGB(0, 0, 0xff123456);
            Thread.currentThread().interrupt();
            try {
                assertThatThrownBy(() -> decoder().decodeInto(media, RenderPolicy.initial(), surface))
                    .isInstanceOf(RenderFileException.class).hasMessage("render-cancelled").hasNoCause();
                assertThat(Thread.currentThread().isInterrupted()).isTrue();
            } finally { Thread.interrupted(); }
            assertThat(surface.image().getRGB(0, 0)).isEqualTo(0xff123456);
        } finally { inspector.deleteQuietly(media.path()); }
        verifyNoInteractions(codec);
    }

    @Test
    void animationAndWebpCannotSilentlyFallBackToAnotherFullRaster() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        byte[] original = Files.readAllBytes(file);
        var bytes = new ByteArrayOutputStream();
        bytes.write(original, 0, 33);
        bytes.write(new byte[] {0, 0, 0, 8, 'a', 'c', 'T', 'L', 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0});
        bytes.write(original, 33, original.length - 33);
        Files.write(file, bytes.toByteArray());
        var media = inspect(file);
        try (var surface = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            assertThatThrownBy(() -> decoder().decodeInto(media, RenderPolicy.initial(), surface))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
            var declaredWebp = new MediaInspectionService.InspectedMedia(media.path(), "image/webp",
                media.byteSize(), WIDTH, HEIGHT, media.sha256());
            assertThatThrownBy(() -> decoder().decodeInto(declaredWebp, RenderPolicy.initial(), surface))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
        } finally { inspector.deleteQuietly(media.path()); }
        verifyNoInteractions(codec);
    }

    @Test
    void bridgeRejectsMissingWrongSizeOffsetOrMultiBankStorage() {
        var source = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        var type = ImageTypeSpecifier.createFromRenderedImage(source);
        for (var buffer : Arrays.asList(null, new DataBufferInt(WIDTH * HEIGHT - 1),
                new DataBufferInt(new int[WIDTH * HEIGHT + 1], WIDTH * HEIGHT, 1),
                new DataBufferInt(WIDTH * HEIGHT, 2))) {
            assertThatThrownBy(() -> new ArgbDecodeDestination(type, WIDTH, HEIGHT, buffer))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
        }
    }

    private void verifyDecode(Path file) throws Exception {
        var media = inspect(file);
        var expected = ImageIO.read(file.toFile());
        try (var surface = new NativeArgbRaster(WIDTH, HEIGHT, RenderPolicy.initial())) {
            var buffer = surface.image().getRaster().getDataBuffer();
            decoder().decodeInto(media, RenderPolicy.initial(), surface);
            assertThat(surface.image().getRaster().getDataBuffer()).isSameAs(buffer);
            for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
                assertThat(surface.image().getRGB(x, y)).isEqualTo(expected.getRGB(x, y));
                assertThat(surface.pixels().getAtIndex(JAVA_INT, y * WIDTH + x)).isEqualTo(expected.getRGB(x, y));
            }
        } finally { inspector.deleteQuietly(media.path()); }
        verifyNoInteractions(codec);
    }

    private ValidatedRasterDecoder decoder() { return new ValidatedRasterDecoder(codec); }
    private MediaInspectionService.InspectedMedia inspect(Path file) throws Exception {
        try (var input = Files.newInputStream(file)) { return inspector.inspect(input, RenderPolicy.MAX_ORIGINAL_BYTES); }
    }
    private Path fixture(String format, int type) throws Exception {
        var image = new BufferedImage(WIDTH, HEIGHT, type);
        for (int y = 0; y < HEIGHT; y++) for (int x = 0; x < WIDTH; x++) {
            image.setRGB(x, y, (format.equals("png") ? (x * 17 & 255) << 24 : 0xff000000)
                | (x * 19 << 16) | (y * 13 << 8) | ((x * 7 + y * 3) & 255));
        }
        var file = Files.createTempFile(temporary, "native-fixture-", "." + format);
        assertThat(ImageIO.write(image, format, file.toFile())).isTrue();
        return file;
    }
}
