package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.io.DataInputStream;
import java.security.MessageDigest;
import java.util.Arrays;

/** Independent test JVM: proves lossless pixels outside supplied rectangles without content files. */
public final class VolatilePixelComparator {
    private VolatilePixelComparator() { }
    public static void main(String[] arguments) {
        byte[] original = null, rendered = null;
        try {
            LinuxNativeProcessGuard.apply(NativeProcessLimits.initial());
            var input = new DataInputStream(System.in);
            var settings = VolatileRenderProtocol.readSettings(input);
            if (!settings.settings().limits().equals(NativeProcessLimits.initial())) throw new IllegalArgumentException();
            original = VolatileRenderProtocol.readFrame(input, (int) settings.policy().maxOriginalBytes());
            rendered = VolatileRenderProtocol.readFrame(input, (int) settings.policy().maxOutputBytes());
            boolean expectPaint = input.readBoolean();
            if (input.read() != -1) throw new IllegalArgumentException();
            var request = settings.request(); var codecSettings = settings.settings().codec();
            try (var codec = new NativeWebpCodec(codecSettings.library(), codecSettings.librarySha256(), codecSettings.sharpLibrary(),
                    codecSettings.sharpSha256(), codecSettings.nativeTimeout());
                 var raster = new NativeArgbRaster(settings.source().widthPx(), settings.source().heightPx(), settings.policy())) {
                if ("image/webp".equals(settings.source().mimeType())) codec.decodeMemory(original, settings.source(), settings.policy(), raster);
                else NativeMemoryRenderAdapter.decode(original, request, raster);
                var expected = outsideHash(raster, request);
                var before = expectPaint ? fullHash(raster) : null;
                codec.decodeOutputMemory(rendered, InMemoryMedia.inspectOutput(rendered, settings.policy()), settings.policy(), raster);
                if (!MessageDigest.isEqual(expected, outsideHash(raster, request))) throw new IllegalStateException();
                if (expectPaint && MessageDigest.isEqual(before, fullHash(raster)))
                    throw new IllegalStateException();
            }
            System.out.write(1); System.out.flush();
        } catch (Throwable error) { System.exit(1); }
        finally {
            if (original != null) Arrays.fill(original, (byte) 0);
            if (rendered != null) Arrays.fill(rendered, (byte) 0);
        }
    }

    private static byte[] fullHash(NativeArgbRaster raster) throws Exception {
        var digest = MessageDigest.getInstance("SHA-256");
        digest.update(raster.pixels().asByteBuffer());
        return digest.digest();
    }

    private static byte[] outsideHash(NativeArgbRaster raster, RenderRequest request) throws Exception {
        int width = request.source().widthPx(), height = request.source().heightPx();
        int left = 0, right = 0, top = 0, bottom = 0;
        if (!request.regions().isEmpty()) {
            if (request.regions().size() != 1) throw new IllegalArgumentException();
            var vertices = request.regions().getFirst().polygon();
            left = (int) Math.floor(vertices.stream().mapToDouble(v -> v.x()).min().orElseThrow() * width);
            right = (int) Math.ceil(vertices.stream().mapToDouble(v -> v.x()).max().orElseThrow() * width);
            top = (int) Math.floor(vertices.stream().mapToDouble(v -> v.y()).min().orElseThrow() * height);
            bottom = (int) Math.ceil(vertices.stream().mapToDouble(v -> v.y()).max().orElseThrow() * height);
        }
        var digest = MessageDigest.getInstance("SHA-256");
        for (int y = 0; y < height; y++) {
            long offset = (long) y * width * Integer.BYTES;
            if (request.regions().isEmpty() || y < top || y >= bottom) digest.update(raster.pixels().asSlice(offset, (long) width * Integer.BYTES).asByteBuffer());
            else {
                digest.update(raster.pixels().asSlice(offset, (long) left * Integer.BYTES).asByteBuffer());
                digest.update(raster.pixels().asSlice(offset + (long) right * Integer.BYTES, (long) (width - right) * Integer.BYTES).asByteBuffer());
            }
        }
        return digest.digest();
    }
}
