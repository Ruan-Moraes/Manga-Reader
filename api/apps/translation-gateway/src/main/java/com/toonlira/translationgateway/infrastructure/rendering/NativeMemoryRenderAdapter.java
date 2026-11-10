package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.INVALID_MEDIA;

import com.toonlira.translationgateway.application.port.VolatileRenderPort;
import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;

/** Child-only codec; compressed input, raster, metadata and encoded result never touch a media file. */
final class NativeMemoryRenderAdapter implements VolatileRenderPort {
    private final NativeRenderChildSettings settings;
    private final PageRasterPainter painter;
    NativeMemoryRenderAdapter(NativeRenderChildSettings settings, PageRasterPainter painter) {
        this.settings = settings; this.painter = painter;
    }

    @Override public Output render(byte[] original, RenderRequest request) {
        byte[] encoded = null;
        boolean transferred = false;
        try {
            if (!InMemoryMedia.inspect(original, request.policy()).equals(request.source())) invalid();
            try (var codec = new NativeWebpCodec(settings.library(), settings.librarySha256(), settings.sharpLibrary(),
                    settings.sharpSha256(), settings.nativeTimeout());
                 var raster = new NativeArgbRaster(request.source().widthPx(), request.source().heightPx(), request.policy())) {
                if ("image/webp".equals(request.source().mimeType())) codec.decodeMemory(original, request.source(), request.policy(), raster);
                else decode(original, request, raster);
                var placements = painter.paint(raster.image(), request);
                encoded = codec.encodeMemory(raster, request.policy());
                var checked = InMemoryMedia.inspectOutput(encoded, request.policy());
                if (!"image/webp".equals(checked.mimeType()) || checked.widthPx() != request.source().widthPx()
                    || checked.heightPx() != request.source().heightPx()) invalid();
                var image = new RenderedImage(checked.mimeType(), checked.byteSize(), checked.widthPx(), checked.heightPx(), checked.sha256());
                var output = new Output(encoded, RenderManifest.create(request, image, placements));
                transferred = true;
                return output;
            }
        } finally {
            if (!transferred && encoded != null) Arrays.fill(encoded, (byte) 0);
        }
    }

    static void decode(byte[] bytes, RenderRequest request, NativeArgbRaster raster) {
        String expected = "image/png".equals(request.source().mimeType())
            ? "com.sun.imageio.plugins.png.PNGImageReader" : "com.sun.imageio.plugins.jpeg.JPEGImageReader";
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
            ImageReader selected = null;
            try {
                var readers = ImageIO.getImageReaders(input);
                while (readers.hasNext()) {
                    var reader = readers.next();
                    if (expected.equals(reader.getClass().getName())) { selected = reader; break; }
                    reader.dispose();
                }
                if (selected == null) invalid();
                selected.setInput(input, false, true);
                selected.addIIOReadWarningListener((source, warning) -> invalid());
                if (selected.getWidth(0) != request.source().widthPx() || selected.getHeight(0) != request.source().heightPx()
                    || selected.getNumImages(true) != 1) invalid();
                var bridge = new ArgbDecodeDestination(selected.getImageTypes(0).next(), request.source().widthPx(),
                    request.source().heightPx(), raster.image().getRaster().getDataBuffer());
                var parameters = selected.getDefaultReadParam();
                parameters.setDestination(bridge.destination());
                if (selected.read(0, parameters) != bridge.destination()) invalid();
            } finally { if (selected != null) selected.dispose(); }
        } catch (IOException error) { throw new RenderFileException(INVALID_MEDIA); }
    }
    private static void invalid() { throw new RenderFileException(INVALID_MEDIA); }
}
