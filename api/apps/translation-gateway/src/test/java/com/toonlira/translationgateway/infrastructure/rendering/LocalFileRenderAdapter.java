package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.BUSY;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CLEANUP_FAILED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CANCELLED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.INVALID_MEDIA;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.concurrent.Semaphore;

/** Explicit, local-only adapter. Success transfers ownership of the new output file to the caller. */
public final class LocalFileRenderAdapter implements RenderPort {
    private static final Semaphore RENDER_CAPACITY = new Semaphore(1);
    private final WebpProcessCodec codec;
    private final PageRasterPainter painter;
    private final Path temporaryDirectory;
    private final MediaInspectionService inspector = new MediaInspectionService();

    public LocalFileRenderAdapter(WebpProcessCodec codec, PageRasterPainter painter, Path temporaryDirectory) {
        try {
            if (codec == null || painter == null || temporaryDirectory == null || !temporaryDirectory.isAbsolute()
                || !Files.isDirectory(temporaryDirectory, LinkOption.NOFOLLOW_LINKS)) throw new RenderFileException(CONFIGURATION);
            this.codec = codec;
            this.painter = painter;
            this.temporaryDirectory = temporaryDirectory.toRealPath();
        } catch (IOException error) { throw new RenderFileException(CONFIGURATION); }
    }

    @Override public Output render(Path original, RenderRequest request) {
        ValidatedRasterDecoder.checkInterrupted();
        if (!RENDER_CAPACITY.tryAcquire()) throw new RenderFileException(BUSY);
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
            if (!matches(media, request.source())) throw new RenderFileException(INVALID_MEDIA);
            var raster = new ValidatedRasterDecoder(codec).decode(media, request.policy());
            try {
                var placements = painter.paint(raster, request);
                ValidatedRasterDecoder.checkInterrupted();
                var artifact = codec.encode(raster, temporaryDirectory, request.policy());
                // The codec creates render-* in this directory. Never remove an unowned input on a bad adapter result.
                if (artifact == null || artifact.path() == null || !artifact.path().isAbsolute()
                    || !artifact.path().getParent().equals(temporaryDirectory)
                    || !artifact.path().getFileName().toString().startsWith("render-")
                    || Files.isSameFile(artifact.path(), original) || Files.isSameFile(artifact.path(), snapshot))
                    throw new RenderFileException(UNAVAILABLE);
                output = artifact.path();
                if (!Files.isRegularFile(output, LinkOption.NOFOLLOW_LINKS)
                    || artifact.image() == null || Files.size(output) != artifact.image().byteSize()) throw new RenderFileException(UNAVAILABLE);
                ValidatedRasterDecoder.checkInterrupted();
                var manifest = RenderManifest.create(request, artifact.image(), placements);
                cleanup(snapshot);
                snapshot = null;
                var result = new Output(output, manifest);
                returned = true;
                return result;
            } finally { raster.flush(); }
        } catch (RenderFileException error) { throw error; }
        catch (GatewayException error) {
            throw new RenderFileException(error.code() == GatewayErrorCode.STORAGE_UNAVAILABLE ? UNAVAILABLE : INVALID_MEDIA);
        }
        catch (RenderPaintingException error) {
            throw new RenderFileException(error.failure() == RenderPaintingException.Failure.CANCELLED ? CANCELLED : UNAVAILABLE);
        }
        catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
        finally {
            try { cleanup(snapshot, returned ? null : output); }
            finally { RENDER_CAPACITY.release(); }
        }
    }

    private static boolean matches(MediaInspectionService.InspectedMedia media, RenderSource expected) {
        return media.mimeType().equals(expected.mimeType()) && media.byteSize() == expected.byteSize()
            && media.widthPx() == expected.widthPx() && media.heightPx() == expected.heightPx()
            && MessageDigest.isEqual(HexFormat.of().parseHex(media.sha256()), HexFormat.of().parseHex(expected.sha256()));
    }

    private static void cleanup(Path... paths) {
        boolean failed = false;
        for (var path : paths) if (path != null) {
            try { Files.deleteIfExists(path); } catch (IOException error) { failed = true; }
        }
        if (failed) throw new RenderFileException(CLEANUP_FAILED);
    }
    @Override public String toString() { return "LocalFileRenderAdapter[redacted]"; }
}
