package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class LocalFileRenderAdapterTest {
    @TempDir Path temporary;
    private final WebpProcessCodec codec = mock(WebpProcessCodec.class);
    private final PageRasterPainter painter = mock(PageRasterPainter.class);

    @ParameterizedTest
    @ValueSource(strings = {"hash", "mime", "bytes", "width", "height"})
    void divergentMetadataFailsBeforePainterOrEncoder(String field) throws Exception {
        var file = png();
        var source = metadata(file);
        var wrong = new RenderSource(field.equals("mime") ? "image/jpeg" : source.mimeType(),
            source.byteSize() + (field.equals("bytes") ? 1 : 0), source.widthPx() + (field.equals("width") ? 1 : 0),
            source.heightPx() + (field.equals("height") ? 1 : 0), field.equals("hash") ? "0".repeat(64) : source.sha256());
        var request = request(wrong, List.of(), RenderPolicy.initial());
        var before = Files.readAllBytes(file);
        assertThatThrownBy(() -> adapter().render(file, request)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-invalid-media").hasNoCause();
        assertThat(Files.readAllBytes(file)).containsExactly(before);
        assertThat(ownedOutputs()).isEmpty();
        verifyNoInteractions(codec, painter);
    }

    @Test
    void acquisitionNeverAcceptsSymlinkMissingFileOrDirectory() throws Exception {
        var file = png();
        var request = request(metadata(file), List.of(), RenderPolicy.initial());
        var symlink = temporary.resolve("alias.png");
        Files.createSymbolicLink(symlink, file);
        for (var invalid : List.of(symlink, temporary.resolve("missing"), temporary)) {
            assertThatThrownBy(() -> adapter().render(invalid, request)).isInstanceOf(RenderFileException.class)
                .hasMessage("render-invalid-media").hasNoCause();
        }
        verifyNoInteractions(codec, painter);
        assertThat(Files.exists(file)).isTrue();
    }

    @Test
    void actualBytesAbovePolicyFailBeforeDecodeWithoutDeletingOriginal() throws Exception {
        var file = png();
        var source = metadata(file);
        var policy = new RenderPolicy("small-1.0", source.byteSize(), 12000, 12000, 80000000, 4096, 4096, 12, 48, 2);
        var request = request(source, List.of(), policy);
        Files.write(file, new byte[(int) source.byteSize() + 1]);
        assertThatThrownBy(() -> adapter().render(file, request)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-invalid-media").hasNoCause();
        assertThat(Files.size(file)).isEqualTo(source.byteSize() + 1);
        verifyNoInteractions(codec, painter);
    }

    @Test
    void paintingFailureAndInterruptedCallDoNotLeaveOutputOrRawCause() throws Exception {
        var file = png();
        var request = request(metadata(file), List.of(), RenderPolicy.initial());
        when(painter.paint(any(), eq(request))).thenThrow(new IllegalStateException("secret text/path/job"));
        assertThatThrownBy(() -> adapter().render(file, request)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-unavailable").hasNoCause();
        assertThat(ownedOutputs()).isEmpty();
        assertThat(Files.exists(file)).isTrue();
        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> adapter().render(file, request)).isInstanceOf(RenderFileException.class)
                .hasMessage("render-cancelled").hasNoCause();
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
        } finally { Thread.interrupted(); }
    }

    @Test
    void encoderFailureCleansOnlyItsOwnFilesAndCapacityBecomesAvailable() throws Exception {
        var file = png();
        var before = Files.readAllBytes(file);
        var unrelated = Files.writeString(temporary.resolve("keep.txt"), "unrelated");
        var request = request(metadata(file), List.of(), RenderPolicy.initial());
        when(painter.paint(any(), eq(request))).thenReturn(List.of());
        when(codec.encode(any(), any(), any())).thenThrow(new RenderCodecException(RenderCodecException.Failure.TIMEOUT));
        for (int attempt = 0; attempt < 2; attempt++) {
            assertThatThrownBy(() -> adapter().render(file, request)).isInstanceOf(RenderFileException.class)
                .hasMessage("render-unavailable").hasNoCause();
        }
        assertThat(Files.readAllBytes(file)).containsExactly(before);
        assertThat(Files.readString(unrelated)).isEqualTo("unrelated");
        assertThat(ownedOutputs()).isEmpty();
    }

    @Test
    void invalidManifestAfterEncodeRemovesOnlyTheOwnedArtifact() throws Exception {
        var file = png();
        var request = request(metadata(file), List.of(), RenderPolicy.initial());
        var output = Files.write(temporary.toRealPath().resolve("render-owned.webp"), new byte[] {1, 2, 3});
        when(painter.paint(any(), eq(request))).thenReturn(List.of());
        when(codec.encode(any(), any(), any())).thenReturn(new WebpProcessCodec.Artifact(output,
            new RenderedImage("image/webp", 3, 1, 1, "a".repeat(64))));
        assertThatThrownBy(() -> adapter().render(file, request)).isInstanceOf(RenderFileException.class)
            .hasMessage("render-unavailable").hasNoCause();
        assertThat(Files.exists(output)).isFalse();
        assertThat(Files.exists(file)).isTrue();
    }

    @Test
    void oneCapacityCoversTheWholeRenderNotJustNativeEncode() throws Exception {
        var file = png();
        var request = request(metadata(file), List.of(), RenderPolicy.initial());
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        when(painter.paint(any(), eq(request))).thenAnswer(invocation -> {
            entered.countDown();
            if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("test deadline");
            throw new RenderPaintingException(RenderPaintingException.Failure.UNAVAILABLE);
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var first = executor.submit(() -> adapter().render(file, request));
            try {
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> adapter().render(file, request)).isInstanceOf(RenderFileException.class)
                    .hasMessage("render-busy").hasNoCause();
            } finally { release.countDown(); }
            assertThatThrownBy(() -> first.get(10, TimeUnit.SECONDS)).hasCauseInstanceOf(RenderFileException.class);
        }
        assertThat(ownedOutputs()).isEmpty();
    }

    @Test
    void representationsAndConfigurationErrorsDoNotExposePaths() {
        assertThatThrownBy(() -> new LocalFileRenderAdapter(codec, painter, Path.of("relative")))
            .isInstanceOf(RenderFileException.class).hasMessage("render-configuration").hasNoCause();
        assertThat(adapter().toString()).isEqualTo("LocalFileRenderAdapter[redacted]");
    }

    private LocalFileRenderAdapter adapter() { return new LocalFileRenderAdapter(codec, painter, temporary); }
    private List<Path> ownedOutputs() throws Exception {
        try (var files = Files.list(temporary)) { return files.filter(p -> p.getFileName().toString().startsWith("render-")).toList(); }
    }
    private Path png() throws Exception {
        var file = temporary.resolve("original.png");
        assertThat(ImageIO.write(CleanBoxPainterTest.fixture(320, 220, 0xffeeeeee), "png", file.toFile())).isTrue();
        return file;
    }

    static RenderSource metadata(Path path) throws Exception {
        var inspector = new MediaInspectionService();
        try (var input = Files.newInputStream(path)) {
            var media = inspector.inspect(input, RenderPolicy.MAX_ORIGINAL_BYTES);
            try { return new RenderSource(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256()); }
            finally { inspector.deleteQuietly(media.path()); }
        }
    }

    static RenderRequest request(RenderSource source, List<OcrManifest.Region> regions, RenderPolicy policy) {
        var job = new UUID(0, 123);
        var pair = new LanguagePair("en", "pt-BR");
        var ocr = new OcrManifest("1.0", job, "en", source.widthPx(), source.heightPx(), regions);
        var input = new TranslationRequest(job, pair, regions.stream().map(region ->
            new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
        var translated = new TranslationValidator(Set.of(pair)).validateResponse(input, new TranslationResponse(regions.stream()
            .map(region -> new TranslationResponse.Region(region.id(), "Olá, mangá!")).toList()));
        return RenderRequest.create(source, ocr, translated, "b".repeat(64), "c".repeat(64), policy);
    }
}
