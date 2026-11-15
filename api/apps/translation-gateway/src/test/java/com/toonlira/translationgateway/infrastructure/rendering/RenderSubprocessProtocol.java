package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationLimits;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Versioned internal IPC, never ObjectInputStream or a public artifact format. */
final class RenderSubprocessProtocol {
    static final int MAX_REQUEST_BYTES = 8 * 1024 * 1024;
    private static final int MAX_RESULT_BYTES = 64 * 1024;
    private static final int REQUEST_MAGIC = 0x54524e31;
    private static final int NATIVE_REQUEST_MAGIC = 0x54524e32;
    private static final int BOUNDED_NATIVE_REQUEST_MAGIC = 0x54524e33;
    private static final int RESULT_MAGIC = 0x54525331;

    private RenderSubprocessProtocol() { }

    static void writeRequest(Path file, Path original, RenderProcessSettings settings, RenderRequest request) {
        try {
            var bytes = new ByteArrayOutputStream();
            try (var out = new DataOutputStream(bytes)) {
                out.writeInt(switch (settings) {
                    case RenderChildSettings cli -> REQUEST_MAGIC;
                    case NativeRenderChildSettings nativeCodec -> NATIVE_REQUEST_MAGIC;
                    case BoundedNativeRenderChildSettings bounded -> BOUNDED_NATIVE_REQUEST_MAGIC;
                });
                out.writeUTF(original.toString());
                switch (settings) {
                    case RenderChildSettings cli -> {
                        out.writeUTF(cli.encoder().toString()); out.writeUTF(cli.encoderSha256());
                        out.writeUTF(cli.decoder().toString()); out.writeUTF(cli.decoderSha256());
                    }
                    case NativeRenderChildSettings nativeCodec -> {
                        out.writeUTF(nativeCodec.library().toString()); out.writeUTF(nativeCodec.librarySha256());
                        out.writeUTF(nativeCodec.sharpLibrary().toString()); out.writeUTF(nativeCodec.sharpSha256());
                    }
                    case BoundedNativeRenderChildSettings bounded -> {
                        var nativeCodec = bounded.codec();
                        out.writeUTF(nativeCodec.library().toString()); out.writeUTF(nativeCodec.librarySha256());
                        out.writeUTF(nativeCodec.sharpLibrary().toString()); out.writeUTF(nativeCodec.sharpSha256());
                    }
                }
                out.writeLong(settings.nativeTimeout().toNanos());
                if (settings instanceof BoundedNativeRenderChildSettings bounded) {
                    out.writeLong(bounded.limits().addressSpaceBytes()); out.writeLong(bounded.limits().cpuSeconds());
                    out.writeLong(bounded.limits().fileBytes()); out.writeLong(bounded.limits().openFiles());
                }
                uuid(out, request.jobRef());
                out.writeUTF(request.pair().source());
                out.writeUTF(request.pair().target());
                var source = request.source();
                image(out, source.mimeType(), source.byteSize(), source.widthPx(), source.heightPx(), source.sha256());
                out.writeUTF(request.ocrSha256());
                out.writeUTF(request.translationSha256());
                var policy = request.policy();
                out.writeUTF(policy.version());
                out.writeLong(policy.maxOriginalBytes());
                out.writeInt(policy.maxWidthPx());
                out.writeInt(policy.maxHeightPx());
                out.writeLong(policy.maxPixels());
                out.writeLong(policy.maxOutputBytes());
                out.writeInt(policy.maxManifestBytes());
                out.writeInt(policy.minimumFontPx());
                out.writeInt(policy.maximumFontPx());
                out.writeInt(policy.paddingPx());
                out.writeInt(request.regions().size());
                for (var region : request.regions()) {
                    uuid(out, region.id());
                    out.writeInt(region.readingOrder());
                    out.writeUTF(region.sourceText());
                    out.writeUTF(region.translatedText());
                    out.writeInt(region.polygon().size());
                    for (var vertex : region.polygon()) { out.writeDouble(vertex.x()); out.writeDouble(vertex.y()); }
                }
            }
            writePrivate(file, bytes.toByteArray(), MAX_REQUEST_BYTES);
        } catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
    }

    static Request readRequest(Path file) {
        try (var in = input(file, MAX_REQUEST_BYTES)) {
            int version = in.readInt();
            if (version != REQUEST_MAGIC && version != NATIVE_REQUEST_MAGIC && version != BOUNDED_NATIVE_REQUEST_MAGIC) invalid();
            var original = Path.of(in.readUTF());
            if (!original.isAbsolute()) invalid();
            var first = Path.of(in.readUTF()); var firstHash = in.readUTF();
            var second = Path.of(in.readUTF()); var secondHash = in.readUTF();
            var timeout = Duration.ofNanos(in.readLong());
            RenderProcessSettings settings = version == REQUEST_MAGIC
                ? new RenderChildSettings(first, firstHash, second, secondHash, timeout)
                : new NativeRenderChildSettings(first, firstHash, second, secondHash, timeout);
            if (version == BOUNDED_NATIVE_REQUEST_MAGIC) settings = new BoundedNativeRenderChildSettings(
                (NativeRenderChildSettings) settings, new NativeProcessLimits(in.readLong(), in.readLong(), in.readLong(), in.readLong()));
            var job = uuid(in);
            var pair = new LanguagePair(in.readUTF(), in.readUTF());
            var source = new RenderSource(in.readUTF(), in.readLong(), in.readInt(), in.readInt(), in.readUTF());
            var ocrHash = in.readUTF();
            var translationHash = in.readUTF();
            var policy = new RenderPolicy(in.readUTF(), in.readLong(), in.readInt(), in.readInt(), in.readLong(),
                in.readLong(), in.readInt(), in.readInt(), in.readInt(), in.readInt());
            int count = count(in, TranslationLimits.MAX_REGIONS);
            var regions = new ArrayList<OcrManifest.Region>(count);
            var translations = new ArrayList<TranslationResponse.Region>(count);
            for (int index = 0; index < count; index++) {
                var id = uuid(in);
                int order = in.readInt();
                var text = in.readUTF();
                var translated = in.readUTF();
                int vertices = count(in, 4);
                if (vertices != 4) invalid();
                var polygon = new ArrayList<OcrManifest.Vertex>(4);
                for (int vertex = 0; vertex < vertices; vertex++) polygon.add(new OcrManifest.Vertex(in.readDouble(), in.readDouble()));
                regions.add(new OcrManifest.Region(id, order, text, List.copyOf(polygon)));
                translations.add(new TranslationResponse.Region(id, translated));
            }
            end(in);
            var ocr = new OcrManifest("1.0", job, pair.source(), source.widthPx(), source.heightPx(), regions);
            var input = new TranslationRequest(job, pair, regions.stream().map(region ->
                new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
            var result = new TranslationValidator(Set.of(pair)).validateResponse(input, new TranslationResponse(translations));
            return new Request(original, settings, RenderRequest.create(source, ocr, result, ocrHash, translationHash, policy));
        } catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
    }

    static void writeResult(Path file, RenderPort.Output result) {
        try {
            var bytes = new ByteArrayOutputStream();
            try (var out = new DataOutputStream(bytes)) {
                out.writeInt(RESULT_MAGIC);
                out.writeUTF(result.path().getFileName().toString());
                var image = result.manifest().image();
                image(out, image.mimeType(), image.byteSize(), image.widthPx(), image.heightPx(), image.sha256());
                out.writeInt(result.manifest().regions().size());
                for (var region : result.manifest().regions()) {
                    uuid(out, region.id());
                    out.writeBoolean(region.overflow());
                    out.writeInt(region.fontSizePx());
                }
            }
            writePrivate(file, bytes.toByteArray(), MAX_RESULT_BYTES);
        } catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
    }

    static RenderPort.Output readResult(Path file, Path directory, RenderRequest request) {
        try (var in = input(file, MAX_RESULT_BYTES)) {
            if (in.readInt() != RESULT_MAGIC) invalid();
            var name = in.readUTF();
            if (!name.matches("render-[A-Za-z0-9-]+\\.webp")) invalid();
            var image = new RenderedImage(in.readUTF(), in.readLong(), in.readInt(), in.readInt(), in.readUTF());
            int count = count(in, TranslationLimits.MAX_REGIONS);
            var placements = new ArrayList<RenderManifest.Placement>(count);
            for (int index = 0; index < count; index++) {
                var id = uuid(in);
                int overflow = in.readUnsignedByte();
                if (overflow > 1) invalid();
                placements.add(new RenderManifest.Placement(id, overflow == 1, in.readInt()));
            }
            end(in);
            return new RenderPort.Output(directory.resolve(name), RenderManifest.create(request, image, placements));
        } catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
    }

    private static DataInputStream input(Path file, int maximum) throws IOException {
        if (!Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS) || Files.size(file) > maximum) invalid();
        try (var input = Files.newInputStream(file, LinkOption.NOFOLLOW_LINKS)) {
            var bytes = input.readNBytes(maximum + 1);
            if (bytes.length > maximum) invalid();
            return new DataInputStream(new ByteArrayInputStream(bytes));
        }
    }

    private static void writePrivate(Path file, byte[] bytes, int maximum) throws IOException {
        if (bytes.length > maximum) invalid();
        Files.createFile(file, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        Files.write(file, bytes, StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS);
    }

    private static int count(DataInputStream in, int maximum) throws IOException {
        int value = in.readInt();
        if (value < 0 || value > maximum) invalid();
        return value;
    }
    private static void uuid(DataOutputStream out, UUID id) throws IOException {
        out.writeLong(id.getMostSignificantBits()); out.writeLong(id.getLeastSignificantBits());
    }
    private static UUID uuid(DataInputStream in) throws IOException { return new UUID(in.readLong(), in.readLong()); }
    private static void image(DataOutputStream out, String mime, long bytes, int width, int height, String hash) throws IOException {
        out.writeUTF(mime); out.writeLong(bytes); out.writeInt(width); out.writeInt(height); out.writeUTF(hash);
    }
    private static void end(DataInputStream in) throws IOException { if (in.read() != -1) invalid(); }
    private static void invalid() { throw new RenderFileException(UNAVAILABLE); }

    record Request(Path original, RenderProcessSettings settings, RenderRequest request) {
        @Override public String toString() { return "RenderSubprocess.Request[redacted]"; }
    }
}
