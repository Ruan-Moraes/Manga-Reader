package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class NativeFileRenderAdapterTest {
    @TempDir Path temporary;
    private final NativeWebpCodec codec = mock(NativeWebpCodec.class);
    private final PageRasterPainter painter = mock(PageRasterPainter.class);
    private final AtomicInteger created = new AtomicInteger();

    @Test void acquisitionAndHashValidationPrecedeAnyNativeLibraryInitialization() throws Exception {
        var original = png();
        var source = LocalFileRenderAdapterTest.metadata(original);
        var request = LocalFileRenderAdapterTest.request(source, List.of(), RenderPolicy.initial());
        var alias = temporary.resolve("alias.png"); Files.createSymbolicLink(alias, original);
        for (var file : List.of(alias, temporary.resolve("missing"), temporary))
            assertThatThrownBy(() -> adapter().render(file, request)).hasMessage("render-invalid-media").hasNoCause();
        Files.write(original, new byte[] {1, 2, 3});
        assertThatThrownBy(() -> adapter().render(original, request)).hasMessage("render-invalid-media").hasNoCause();
        assertThat(created).hasValue(0);
        verifyNoInteractions(codec, painter);
        assertNoOutput();
    }

    @Test void painterReceivesSharedNativeSurfaceWhoseLifetimeEndsAfterCodecReturns() throws Exception {
        var original = png();
        var before = Files.readAllBytes(original);
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var borrowed = new AtomicReference<NativeArgbRaster>();
        when(painter.paint(any(), eq(request))).thenAnswer(invocation -> {
            assertThat(NativeArgbRaster.isView(invocation.getArgument(0))).isTrue();
            return List.of();
        });
        when(codec.encode(any(), any(), any())).thenAnswer(invocation -> {
            var raster = invocation.<NativeArgbRaster>getArgument(0); borrowed.set(raster);
            assertThat(raster.pixels().scope().isAlive()).isTrue();
            assertThat(raster.image().getRGB(2, 2)).isEqualTo(0xffeeeeee);
            throw new RenderCodecException(RenderCodecException.Failure.TIMEOUT);
        });
        assertThatThrownBy(() -> adapter().render(original, request)).hasMessage("render-timeout").hasNoCause();
        assertThatThrownBy(() -> borrowed.get().pixels()).hasMessage("render-unavailable");
        verify(codec).close();
        assertThat(Files.readAllBytes(original)).containsExactly(before);
        assertNoOutput();
    }

    @Test void malformedOwnedOutputIsRemovedButTheOriginalAndUnrelatedFilesSurvive() throws Exception {
        var original = png();
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var unrelated = Files.writeString(temporary.resolve("keep.txt"), "keep");
        var output = Files.write(temporary.toRealPath().resolve("render-native-owned.webp"), new byte[] {1, 2, 3});
        when(painter.paint(any(), any())).thenReturn(List.of());
        when(codec.encode(any(), any(), any())).thenReturn(new WebpProcessCodec.Artifact(output,
            new RenderedImage("image/webp", 3, 32, 22, "a".repeat(64))));
        assertThatThrownBy(() -> adapter().render(original, request)).hasMessage("render-unavailable").hasNoCause();
        assertThat(output).doesNotExist(); assertThat(original).exists();
        assertThat(Files.readString(unrelated)).isEqualTo("keep");
        verify(codec).close(); assertNoOutput();
    }

    @Test void unownedCodecOutputIsNeverRemoved() throws Exception {
        var original = png();
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var before = Files.readAllBytes(original);
        when(painter.paint(any(), any())).thenReturn(List.of());
        when(codec.encode(any(), any(), any())).thenReturn(new WebpProcessCodec.Artifact(original,
            new RenderedImage("image/webp", 3, 32, 22, "a".repeat(64))));
        assertThatThrownBy(() -> adapter().render(original, request)).hasMessage("render-unavailable");
        assertThat(Files.readAllBytes(original)).containsExactly(before); assertNoOutput();
    }

    @Test void failedNativeCloseCannotTransferAnOtherwiseValidOutput() throws Exception {
        var original = png();
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        // Structural container only: no real codec/quality claim is made by this failure-injection fixture.
        var header = ByteBuffer.allocate(30).order(ByteOrder.LITTLE_ENDIAN);
        header.put(new byte[] {'R', 'I', 'F', 'F'}).putInt(22).put(new byte[] {'W', 'E', 'B', 'P', 'V', 'P', '8', 'L'})
            .putInt(10).put((byte) 0x2f).putInt(31 | 21 << 14);
        var output = Files.write(temporary.toRealPath().resolve("render-native-owned.webp"), header.array());
        var metadata = LocalFileRenderAdapterTest.metadata(output);
        when(painter.paint(any(), any())).thenReturn(List.of());
        when(codec.encode(any(), any(), any())).thenReturn(new WebpProcessCodec.Artifact(output,
            new RenderedImage(metadata.mimeType(), metadata.byteSize(), metadata.widthPx(), metadata.heightPx(), metadata.sha256())));
        doThrow(new RenderCodecException(RenderCodecException.Failure.UNAVAILABLE)).when(codec).close();
        assertThatThrownBy(() -> adapter().render(original, request)).hasMessage("render-unavailable").hasNoCause();
        assertThat(output).doesNotExist(); assertThat(original).exists(); assertNoOutput();
    }

    @Test void capacityIsAcquiredBeforeAcquisitionAndRetainedUntilBorrowedExecutionFinishes() throws Exception {
        var original = png();
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var entered = new CountDownLatch(1); var release = new CountDownLatch(1);
        when(painter.paint(any(), any())).thenReturn(List.of());
        when(codec.encode(any(), any(), any())).thenAnswer(invocation -> {
            entered.countDown();
            if (!release.await(10, TimeUnit.SECONDS)) throw new AssertionError("fixture deadline");
            assertThat(invocation.<NativeArgbRaster>getArgument(0).pixels().scope().isAlive()).isTrue();
            throw new RenderCodecException(RenderCodecException.Failure.UNAVAILABLE);
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var owner = executor.submit(() -> adapter().render(original, request));
            try {
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> adapter().render(temporary.resolve("missing"), request)).hasMessage("render-busy");
                assertThat(created).hasValue(1);
            } finally { release.countDown(); }
            assertThatThrownBy(() -> owner.get(10, TimeUnit.SECONDS)).hasCauseInstanceOf(RenderFileException.class);
        }
        assertNoOutput();
    }

    @Test void cancellationBeforeReservationDoesNotCreateCodecOrExposeConfiguration() throws Exception {
        var original = png();
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        Thread.currentThread().interrupt();
        try { assertThatThrownBy(() -> adapter().render(original, request)).hasMessage("render-cancelled"); }
        finally { Thread.interrupted(); }
        assertThat(created).hasValue(0); verifyNoInteractions(codec, painter);
        assertThat(adapter().toString()).isEqualTo("NativeFileRenderAdapter[redacted]");
    }

    private NativeFileRenderAdapter adapter() {
        return new NativeFileRenderAdapter(painter, temporary, () -> { created.incrementAndGet(); return codec; });
    }
    private Path png() throws Exception {
        var file = temporary.resolve("original.png");
        assertThat(ImageIO.write(CleanBoxPainterTest.fixture(32, 22, 0xffeeeeee), "png", file.toFile())).isTrue();
        return file;
    }
    private void assertNoOutput() throws Exception {
        try (var files = Files.list(temporary)) {
            assertThat(files.map(file -> file.getFileName().toString()).toList()).noneMatch(name -> name.startsWith("render-"));
        }
    }
}
