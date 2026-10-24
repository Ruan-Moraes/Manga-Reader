package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.BUSY;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CANCELLED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CLEANUP_FAILED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.INVALID_MEDIA;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.TIMEOUT;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.concurrent.Semaphore;

/** Child-only FFM rendering. A subprocess supervisor is required; this is not an OOM sandbox. */
final class NativeFileRenderAdapter implements RenderPort {
    private static final Semaphore CAPACITY = new Semaphore(1);
    private final PageRasterPainter painter;
    private final Path temporaryDirectory;
    private final CodecFactory codecs;
    private final MediaInspectionService inspector = new MediaInspectionService();

    NativeFileRenderAdapter(NativeRenderChildSettings settings, PageRasterPainter painter, Path directory) {
        this(painter, directory, factory(settings));
    }

    NativeFileRenderAdapter(PageRasterPainter painter, Path directory, CodecFactory codecs) {
        try {
            if (painter == null || codecs == null || directory == null || !directory.isAbsolute()
                || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)) throw new RenderFileException(CONFIGURATION);
            this.painter = painter; this.codecs = codecs; temporaryDirectory = directory.toRealPath();
        } catch (IOException error) { throw new RenderFileException(CONFIGURATION); }
    }

    @Override public Output render(Path original, RenderRequest request) {
        ValidatedRasterDecoder.checkInterrupted();
        if (!CAPACITY.tryAcquire()) throw new RenderFileException(BUSY);
        Path snapshot = null, output = null;
        boolean returned = false;
        try {
            if (request == null || original == null || !original.isAbsolute()
                || !Files.isRegularFile(original, LinkOption.NOFOLLOW_LINKS)) throw new RenderFileException(INVALID_MEDIA);
            MediaInspectionService.InspectedMedia media;
            try (var input = Files.newInputStream(original, LinkOption.NOFOLLOW_LINKS)) {
                media = inspector.inspect(input, request.policy().maxOriginalBytes());
            }
            snapshot = media.path();
            if (!new RenderSource(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256())
                .equals(request.source())) throw new RenderFileException(INVALID_MEDIA);
            ValidatedRasterDecoder.validateContainer(media);
            Output result;
            // Both owners are created and closed in the rendering thread. No borrowed memory crosses IPC.
            try (var codec = codecs.create();
                 var raster = new NativeArgbRaster(media.widthPx(), media.heightPx(), request.policy())) {
                if (codec == null) throw new RenderFileException(UNAVAILABLE);
                if ("image/webp".equals(media.mimeType())) {
                    codec.decodeOriginalInto(snapshot, request.source(), request.policy(), raster);
                } else new ValidatedRasterDecoder(null).decodeInto(media, request.policy(), raster);
                var placements = painter.paint(raster.image(), request);
                ValidatedRasterDecoder.checkInterrupted();
                var artifact = codec.encode(raster, temporaryDirectory, request.policy());
                if (artifact == null || artifact.path() == null || !artifact.path().isAbsolute()
                    || !temporaryDirectory.equals(artifact.path().getParent())
                    || !artifact.path().getFileName().toString().startsWith("render-native-")
                    || !Files.isRegularFile(artifact.path(), LinkOption.NOFOLLOW_LINKS)
                    || Files.isSameFile(artifact.path(), original) || Files.isSameFile(artifact.path(), snapshot))
                    throw new RenderFileException(UNAVAILABLE);
                output = artifact.path();
                verify(artifact, request);
                ValidatedRasterDecoder.checkInterrupted();
                var manifest = RenderManifest.create(request, artifact.image(), placements);
                cleanup(snapshot); snapshot = null;
                // Mark success only after both native owners close, even when construction/close fails.
                result = new Output(output, manifest);
            }
            returned = true;
            return result;
        } catch (RenderCodecException error) {
            ValidatedRasterDecoder.checkInterrupted();
            throw new RenderFileException(switch (error.failure()) {
                case CONFIGURATION -> CONFIGURATION;
                case INVALID_MEDIA -> INVALID_MEDIA;
                case BUSY -> BUSY;
                case TIMEOUT -> TIMEOUT;
                case CLEANUP_FAILED -> CLEANUP_FAILED;
                default -> UNAVAILABLE;
            });
        } catch (RenderFileException error) { throw error; }
        catch (GatewayException error) {
            throw new RenderFileException(error.code() == GatewayErrorCode.STORAGE_UNAVAILABLE ? UNAVAILABLE : INVALID_MEDIA);
        } catch (RenderPaintingException error) {
            throw new RenderFileException(error.failure() == RenderPaintingException.Failure.CANCELLED ? CANCELLED : UNAVAILABLE);
        } catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
        finally {
            // The output is transferred below only after native execution and close have succeeded.
            // Cleanup failure deliberately poisons capacity rather than admit unbounded orphan accumulation.
            cleanup(snapshot, returned ? null : output);
            CAPACITY.release();
        }
    }

    private void verify(WebpProcessCodec.Artifact artifact, RenderRequest request) throws IOException {
        Path checked = null;
        try {
            if (artifact.image() == null) throw new RenderFileException(UNAVAILABLE);
            MediaInspectionService.InspectedMedia media;
            try (var stream = Files.newInputStream(artifact.path(), LinkOption.NOFOLLOW_LINKS)) {
                media = inspector.inspect(stream, request.policy().maxOutputBytes());
            }
            checked = media.path();
            var image = new RenderedImage(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256());
            if (!image.equals(artifact.image()) || !"image/webp".equals(media.mimeType())) throw new RenderFileException(UNAVAILABLE);
            ValidatedRasterDecoder.validateContainer(media);
        } catch (GatewayException | IllegalArgumentException error) { throw new RenderFileException(UNAVAILABLE); }
        finally { cleanup(checked); }
    }

    private static CodecFactory factory(NativeRenderChildSettings settings) {
        if (settings == null) throw new RenderFileException(CONFIGURATION);
        return () -> new NativeWebpCodec(settings.library(), settings.librarySha256(), settings.sharpLibrary(),
            settings.sharpSha256(), settings.nativeTimeout());
    }
    private static void cleanup(Path... paths) {
        boolean failed = false;
        for (var path : paths) if (path != null) {
            try { Files.deleteIfExists(path); } catch (IOException error) { failed = true; }
        }
        if (failed) throw new RenderFileException(CLEANUP_FAILED);
    }
    @Override public String toString() { return "NativeFileRenderAdapter[redacted]"; }
    @FunctionalInterface interface CodecFactory { NativeWebpCodec create(); }
}
