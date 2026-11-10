package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.port.VolatileRenderPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Bounded private pipe protocol. Never spills a frame to disk. */
final class VolatileRenderProtocol {
    static final int REQUEST_MAGIC = 0x56505231, RESULT_MAGIC = 0x56525331;
    static final int MAX_SETTINGS_BYTES = 8 * 1024 * 1024;
    private VolatileRenderProtocol() { }

    static void writeRequest(DataOutputStream output, byte[] original, RenderRequest request,
                             BoundedNativeRenderChildSettings settings) throws IOException {
        var metadata = new Input(settings, request.jobRef(), request.pair(), request.source(), request.policy(),
            request.ocrSha256(), request.translationSha256(), request.regions());
        var bytes = GatewayJsonMapper.create().writeValueAsBytes(metadata);
        try {
            output.writeInt(REQUEST_MAGIC);
            writeFrame(output, bytes, MAX_SETTINGS_BYTES);
            writeFrame(output, original, (int) request.policy().maxOriginalBytes());
            output.flush();
        } finally { Arrays.fill(bytes, (byte) 0); }
    }

    static Input readSettings(DataInputStream input) throws IOException {
        if (input.readInt() != REQUEST_MAGIC) throw invalid();
        var bytes = readFrame(input, MAX_SETTINGS_BYTES);
        try {
            var settings = GatewayJsonMapper.create().readValue(bytes, Input.class);
            settings.request();
            return settings;
        } finally { Arrays.fill(bytes, (byte) 0); }
    }

    static void writeResult(DataOutputStream output, VolatileRenderPort.Output result) throws IOException {
        output.writeInt(RESULT_MAGIC);
        writeFrame(output, result.image(), (int) RenderPolicy.MAX_OUTPUT_BYTES);
        output.writeInt(result.manifest().regions().size());
        for (var region : result.manifest().regions()) {
            output.writeLong(region.id().getMostSignificantBits()); output.writeLong(region.id().getLeastSignificantBits());
            output.writeBoolean(region.overflow()); output.writeInt(region.fontSizePx());
        }
        output.flush();
    }

    static VolatileRenderPort.Output readResult(DataInputStream input, RenderRequest request) throws IOException {
        if (input.readInt() != RESULT_MAGIC) throw invalid();
        var bytes = readFrame(input, (int) request.policy().maxOutputBytes());
        boolean transferred = false;
        try {
            var source = InMemoryMedia.inspectOutput(bytes, request.policy());
            if (!"image/webp".equals(source.mimeType()) || source.widthPx() != request.source().widthPx()
                || source.heightPx() != request.source().heightPx()) throw invalid();
            int count = input.readInt();
            if (count != request.regions().size()) throw invalid();
            var placements = new ArrayList<RenderManifest.Placement>(count);
            for (int index = 0; index < count; index++) {
                var id = new UUID(input.readLong(), input.readLong());
                int overflow = input.readUnsignedByte();
                if (overflow > 1) throw invalid();
                placements.add(new RenderManifest.Placement(id, overflow == 1, input.readInt()));
            }
            if (input.read() != -1) throw invalid();
            var image = new RenderedImage(source.mimeType(), source.byteSize(), source.widthPx(), source.heightPx(), source.sha256());
            var result = new VolatileRenderPort.Output(bytes, RenderManifest.create(request, image, placements));
            transferred = true;
            return result;
        } finally { if (!transferred) Arrays.fill(bytes, (byte) 0); }
    }

    static byte[] readFrame(DataInputStream input, int limit) throws IOException {
        int size = input.readInt();
        if (size <= 0 || size > limit) throw invalid();
        var bytes = new byte[size];
        try { input.readFully(bytes); return bytes; }
        catch (IOException error) { Arrays.fill(bytes, (byte) 0); throw invalid(); }
    }
    private static void writeFrame(DataOutputStream output, byte[] bytes, int limit) throws IOException {
        if (bytes.length == 0 || bytes.length > limit) throw invalid();
        output.writeInt(bytes.length); output.write(bytes);
    }
    private static IOException invalid() { return new IOException("Invalid volatile frame"); }

    record Input(BoundedNativeRenderChildSettings settings, UUID jobRef, LanguagePair pair, RenderSource source,
                 RenderPolicy policy, String ocrSha256, String translationSha256, List<RenderRequest.Region> regions) {
        RenderRequest request() {
            var ocr = new OcrManifest("1.0", jobRef, pair.source(), source.widthPx(), source.heightPx(), regions.stream()
                .map(region -> new OcrManifest.Region(region.id(), region.readingOrder(), region.sourceText(), region.polygon())).toList());
            var translation = new TranslationRequest(jobRef, pair, regions.stream()
                .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
            var translated = new TranslationValidator(Set.of(pair)).validateResponse(translation, new TranslationResponse(regions.stream()
                .map(region -> new TranslationResponse.Region(region.id(), region.translatedText())).toList()));
            return RenderRequest.create(source, ocr, translated, ocrSha256, translationSha256, policy);
        }
        @Override public String toString() { return "VolatileRenderProtocol.Input[redacted]"; }
    }
}
