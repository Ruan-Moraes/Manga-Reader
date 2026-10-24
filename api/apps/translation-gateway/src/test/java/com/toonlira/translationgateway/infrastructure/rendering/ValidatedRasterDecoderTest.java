package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.image.BufferedImage;
import java.awt.Transparency;
import java.awt.color.ColorSpace;
import java.awt.image.ComponentColorModel;
import java.awt.image.DataBuffer;
import java.awt.image.Raster;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import javax.imageio.ImageIO;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.ImageWriteParam;
import javax.imageio.IIOImage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ValidatedRasterDecoderTest {
    @TempDir Path temporary;
    private final WebpProcessCodec codec = mock(WebpProcessCodec.class);
    private final MediaInspectionService inspector = new MediaInspectionService();

    @ParameterizedTest
    @ValueSource(ints = {BufferedImage.TYPE_INT_ARGB, BufferedImage.TYPE_INT_RGB, BufferedImage.TYPE_4BYTE_ABGR,
        BufferedImage.TYPE_BYTE_GRAY, BufferedImage.TYPE_USHORT_GRAY, BufferedImage.TYPE_BYTE_INDEXED,
        BufferedImage.TYPE_BYTE_BINARY})
    void pngVariantsDecodeIntoOneArgbDestinationAndPreserveDecodedPixels(int type) throws Exception {
        var file = fixture("png", type);
        var expected = ImageIO.read(file.toFile());
        var decoded = decode(file);
        assertThat(decoded.getType()).isEqualTo(BufferedImage.TYPE_INT_ARGB);
        assertThat(decoded.getRGB(0, 0, 13, 17, null, 0, 13))
            .containsExactly(expected.getRGB(0, 0, 13, 17, null, 0, 13));
        verifyNoInteractions(codec);
    }

    @ParameterizedTest
    @ValueSource(ints = {BufferedImage.TYPE_INT_RGB, BufferedImage.TYPE_BYTE_GRAY})
    void jpegRgbAndGrayShareTheDecodedBufferWithAnOpaqueArgbView(int type) throws Exception {
        var file = fixture("jpeg", type);
        var expected = ImageIO.read(file.toFile());
        var decoded = decode(file);
        assertThat(decoded.getType()).isEqualTo(BufferedImage.TYPE_INT_ARGB);
        assertThat(decoded.getRGB(0, 0, 13, 17, null, 0, 13))
            .containsExactly(expected.getRGB(0, 0, 13, 17, null, 0, 13));
        verifyNoInteractions(codec);
    }

    @Test
    void headerThatPassedInspectionButHasTruncatedPixelDataFailsWithoutRawCause() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        byte[] bytes = Files.readAllBytes(file);
        Files.write(file, Arrays.copyOf(bytes, 40));
        assertThatThrownBy(() -> decode(file)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-invalid-media").hasNoCause();
        verifyNoInteractions(codec);
    }

    @Test
    void jpegWithoutEndMarkerIsNotAcceptedAsACompletePage() throws Exception {
        var file = fixture("jpeg", BufferedImage.TYPE_INT_RGB);
        var bytes = Files.readAllBytes(file);
        Files.write(file, Arrays.copyOf(bytes, bytes.length - 2));
        assertThatThrownBy(() -> decode(file)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-invalid-media").hasNoCause();
    }

    @Test
    void policyDimensionsAreCheckedBeforePixelAllocation() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        var media = inspect(file);
        var policy = new RenderPolicy("small-1.0", 4096, 12, 16, 192, 4096, 4096, 12, 48, 2);
        try {
            assertThatThrownBy(() -> new ValidatedRasterDecoder(codec).decode(media, policy))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
        } finally { inspector.deleteQuietly(media.path()); }
        verifyNoInteractions(codec);
    }

    @Test
    void mismatchedDecoderHeaderIsRejected() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        var media = inspect(file);
        var wrong = new MediaInspectionService.InspectedMedia(media.path(), media.mimeType(), media.byteSize(),
            12, media.heightPx(), media.sha256());
        try {
            assertThatThrownBy(() -> new ValidatedRasterDecoder(codec).decode(wrong, RenderPolicy.initial()))
                .isInstanceOf(RenderFileException.class).hasMessage("render-invalid-media").hasNoCause();
        } finally { inspector.deleteQuietly(media.path()); }
    }

    @Test
    void animatedPngIsRejectedBeforePixelDecode() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        byte[] original = Files.readAllBytes(file);
        var result = new ByteArrayOutputStream();
        result.write(original, 0, 33);
        // Synthetic acTL chunk; no need to decode or tolerate an animation regardless of its CRC.
        result.write(new byte[] {0, 0, 0, 8, 'a', 'c', 'T', 'L', 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0});
        result.write(original, 33, original.length - 33);
        Files.write(file, result.toByteArray());
        assertThatThrownBy(() -> decode(file)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-invalid-media").hasNoCause();
    }

    @Test
    void interruptionIsPreservedAndDoesNotStartCodec() throws Exception {
        var file = fixture("png", BufferedImage.TYPE_INT_ARGB);
        var media = inspect(file);
        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> new ValidatedRasterDecoder(codec).decode(media, RenderPolicy.initial()))
                .isInstanceOf(RenderFileException.class).hasMessage("render-cancelled").hasNoCause();
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally { Thread.interrupted(); inspector.deleteQuietly(media.path()); }
        verifyNoInteractions(codec);
    }

    @ParameterizedTest
    @ValueSource(ints = {BufferedImage.TYPE_INT_RGB, BufferedImage.TYPE_4BYTE_ABGR, BufferedImage.TYPE_BYTE_GRAY,
        BufferedImage.TYPE_USHORT_GRAY, BufferedImage.TYPE_BYTE_INDEXED, BufferedImage.TYPE_BYTE_BINARY})
    void bridgeConvertsPixelWritesWithoutASecondFullPageAllocation(int type) {
        var source = new BufferedImage(1, 1, type);
        source.setRGB(0, 0, 0x7fa9c3e5);
        var samples = source.getRaster().getPixel(0, 0, (int[]) null);
        var bridge = new ArgbDecodeDestination(ImageTypeSpecifier.createFromRenderedImage(source), 13, 17);
        bridge.destination().getRaster().setPixel(2, 3, samples);
        var view = bridge.argbView();
        assertThat(view.getRaster().getDataBuffer()).isSameAs(bridge.destination().getRaster().getDataBuffer());
        assertThat(view.getRGB(2, 3)).isEqualTo(source.getRGB(0, 0));
        view.setRGB(2, 3, 0xff123456);
        assertThat(bridge.destination().getRGB(2, 3)).isEqualTo(0xff123456);
    }

    @ParameterizedTest
    @ValueSource(strings = {"png", "jpeg"})
    void interlacedPngAndProgressiveJpegPreserveTheJdkDecodedAppearance(String format) throws Exception {
        var image = new BufferedImage(13, 17, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 17; y++) for (int x = 0; x < 13; x++) image.setRGB(x, y, x * 13 << 16 | y * 11 << 8);
        var file = temporary.resolve("progressive." + format);
        var writer = ImageIO.getImageWritersByFormatName(format).next();
        try (var output = ImageIO.createImageOutputStream(file.toFile())) {
            writer.setOutput(output);
            var parameters = writer.getDefaultWriteParam();
            parameters.setProgressiveMode(ImageWriteParam.MODE_DEFAULT);
            writer.write(null, new IIOImage(image, null, null), parameters);
        } finally { writer.dispose(); }
        var expected = ImageIO.read(file.toFile());
        assertThat(decode(file).getRGB(0, 0, 13, 17, null, 0, 13))
            .containsExactly(expected.getRGB(0, 0, 13, 17, null, 0, 13));
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void sixteenBitColorAndGrayAlphaPngPreserveTheJdkDecodedAppearance(boolean gray) throws Exception {
        int bands = gray ? 2 : 4;
        var space = ColorSpace.getInstance(gray ? ColorSpace.CS_GRAY : ColorSpace.CS_sRGB);
        var color = new ComponentColorModel(space, true, false, Transparency.TRANSLUCENT, DataBuffer.TYPE_USHORT);
        var raster = Raster.createInterleavedRaster(DataBuffer.TYPE_USHORT, 13, 17, bands, null);
        var image = new BufferedImage(color, raster, false, null);
        for (int y = 0; y < 17; y++) for (int x = 0; x < 13; x++) {
            int[] pixel = gray ? new int[] {x * 4096 + y * 13, y * 3500}
                : new int[] {x * 4096 + 113, y * 3500 + 17, (x + y) * 2000, y * 3500};
            raster.setPixel(x, y, pixel);
        }
        var file = temporary.resolve("sixteen.png");
        assertThat(ImageIO.write(image, "png", file.toFile())).isTrue();
        var expected = ImageIO.read(file.toFile());
        assertThat(decode(file).getRGB(0, 0, 13, 17, null, 0, 13))
            .containsExactly(expected.getRGB(0, 0, 13, 17, null, 0, 13));
    }

    @ParameterizedTest
    @ValueSource(strings = {"flag", "ANIM", "ANMF", "bounds", "riff"})
    void animatedOrMalformedWebpIsRejectedBeforeNativeDecode(String condition) throws Exception {
        byte[] container = webpContainer(condition.equals("ANIM") || condition.equals("ANMF") ? condition : null);
        if (condition.equals("flag")) container[20] = 0x02;
        if (condition.equals("bounds")) ByteBuffer.wrap(container).order(ByteOrder.LITTLE_ENDIAN).putInt(16, 500);
        if (condition.equals("riff")) container[4] = 0;
        var file = Files.write(temporary.resolve("invalid.webp"), container);
        assertThatThrownBy(() -> decode(file)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-invalid-media").hasNoCause();
        verifyNoInteractions(codec);
    }

    @Test
    void nativeUnavailabilityIsNotMisclassifiedAsInvalidImage() throws Exception {
        var file = Files.write(temporary.resolve("fixture.webp"), webpContainer(null));
        when(codec.decode(any(), any(), any())).thenThrow(new RenderCodecException(RenderCodecException.Failure.TIMEOUT));
        assertThatThrownBy(() -> decode(file)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-unavailable").hasNoCause();
    }

    private static byte[] webpContainer(String extraChunk) {
        var bytes = ByteBuffer.allocate(extraChunk == null ? 30 : 38).order(ByteOrder.LITTLE_ENDIAN);
        bytes.put("RIFF".getBytes(StandardCharsets.US_ASCII)).putInt(bytes.capacity() - 8);
        bytes.put("WEBPVP8X".getBytes(StandardCharsets.US_ASCII)).putInt(10).put(new byte[10]);
        if (extraChunk != null) bytes.put(extraChunk.getBytes(StandardCharsets.US_ASCII)).putInt(0);
        return bytes.array();
    }

    private BufferedImage decode(Path file) throws Exception {
        var media = inspect(file);
        try { return new ValidatedRasterDecoder(codec).decode(media, RenderPolicy.initial()); }
        finally { inspector.deleteQuietly(media.path()); }
    }

    private MediaInspectionService.InspectedMedia inspect(Path file) throws Exception {
        try (var input = Files.newInputStream(file)) { return inspector.inspect(input, RenderPolicy.MAX_ORIGINAL_BYTES); }
    }

    private Path fixture(String format, int type) throws Exception {
        var image = new BufferedImage(13, 17, type);
        for (int y = 0; y < 17; y++) for (int x = 0; x < 13; x++) {
            image.setRGB(x, y, (format.equals("png") ? (x * 17 & 255) << 24 : 0xff000000)
                | (x * 19 << 16) | (y * 13 << 8) | ((x * 7 + y * 3) & 255));
        }
        var file = Files.createTempFile(temporary, "fixture-", "." + format);
        assertThat(ImageIO.write(image, format, file.toFile())).isTrue();
        return file;
    }
}
