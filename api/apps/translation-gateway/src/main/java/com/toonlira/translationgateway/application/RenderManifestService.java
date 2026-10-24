package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.ObjectReader;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Strict private artifact codec. No native resource is loaded by construction. */
@Component
public final class RenderManifestService {
    private final ObjectMapper mapper;
    private final ObjectReader reader;

    public RenderManifestService(ObjectMapper mapper) {
        this.mapper = mapper.rebuild().disable(MapperFeature.ALLOW_COERCION_OF_SCALARS).build();
        this.reader = this.mapper.readerFor(Document.class)
            .with(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
                DeserializationFeature.FAIL_ON_TRAILING_TOKENS,
                DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES,
                DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES,
                DeserializationFeature.FAIL_ON_NULL_CREATOR_PROPERTIES)
            .without(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
            .with(StreamReadFeature.STRICT_DUPLICATE_DETECTION);
    }

    public Encoded encode(RenderManifest manifest, RenderPolicy policy) {
        try {
            if (manifest == null || policy == null || !policy.version().equals(manifest.policyVersion())
                || manifest.image().byteSize() > policy.maxOutputBytes()
                || manifest.image().widthPx() > policy.maxWidthPx()
                || manifest.image().heightPx() > policy.maxHeightPx()
                || (long) manifest.image().widthPx() * manifest.image().heightPx() > policy.maxPixels()) invalid();
            for (var region : manifest.regions()) {
                if (!region.overflow() && (region.fontSizePx() < policy.minimumFontPx()
                    || region.fontSizePx() > policy.maximumFontPx())) invalid();
            }
            var output = new BoundedOutput(policy.maxManifestBytes());
            mapper.writeValue(output, new Document(manifest.version(), manifest.policyVersion(), manifest.jobRef(),
                manifest.sourceLanguage(), manifest.targetLanguage(), manifest.originalSha256(), manifest.ocrSha256(),
                manifest.translationSha256(), manifest.image(), manifest.regions()));
            var bytes = output.bytes();
            return new Encoded(bytes, hash(bytes));
        } catch (NoSuchAlgorithmException | RuntimeException error) {
            throw new RenderValidationException(INVALID_OUTPUT);
        }
    }

    public RenderManifest decode(byte[] bytes, String sha256, RenderRequest request, RenderedImage expectedImage) {
        try {
            if (request == null || expectedImage == null || bytes == null || bytes.length == 0
                || bytes.length > request.policy().maxManifestBytes()
                || sha256 == null || !sha256.matches("[0-9a-f]{64}")) invalid();
            byte[] snapshot = bytes.clone();
            if (!MessageDigest.isEqual(MessageDigest.getInstance("SHA-256").digest(snapshot),
                HexFormat.of().parseHex(sha256))) invalid();
            String json = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(snapshot)).toString();
            if (json.startsWith("\uFEFF")) json = json.substring(1);
            Document document = reader.readValue(json);
            validateBinding(document, request, expectedImage);
            var placements = document.regions().stream()
                .map(region -> new RenderManifest.Placement(region.id(), region.overflow(), region.fontSizePx())).toList();
            return RenderManifest.create(request, expectedImage, placements);
        } catch (IOException | NoSuchAlgorithmException | RuntimeException error) {
            // Parser messages and causes may contain text, object identifiers or raw bytes.
            throw new RenderValidationException(INVALID_OUTPUT);
        }
    }

    private static void validateBinding(Document document, RenderRequest request, RenderedImage image) {
        if (document == null || !RenderManifest.VERSION.equals(document.version())
            || !request.policy().version().equals(document.policyVersion())
            || !request.jobRef().equals(document.jobRef())
            || !request.pair().source().equals(document.sourceLanguage())
            || !request.pair().target().equals(document.targetLanguage())
            || !request.source().sha256().equals(document.originalSha256())
            || !request.ocrSha256().equals(document.ocrSha256())
            || !request.translationSha256().equals(document.translationSha256())
            || !image.equals(document.image()) || document.regions() == null
            || document.regions().size() != request.regions().size()) invalid();
        for (int order = 0; order < request.regions().size(); order++) {
            var source = request.regions().get(order);
            var region = document.regions().get(order);
            if (region == null || !source.id().equals(region.id()) || region.readingOrder() != order
                || !source.sourceText().equals(region.sourceText())
                || !source.translatedText().equals(region.translatedText())
                || !source.polygon().equals(region.polygon())) invalid();
        }
    }

    private static String hash(byte[] bytes) throws NoSuchAlgorithmException {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    private static void invalid() { throw new RenderValidationException(INVALID_OUTPUT); }

    private record Document(String version, String policyVersion, UUID jobRef, String sourceLanguage,
                            String targetLanguage, String originalSha256, String ocrSha256,
                            String translationSha256, RenderedImage image, List<RenderManifest.Region> regions) {
        @Override public String toString() { return "RenderManifest.Document[redacted]"; }
    }

    public record Encoded(byte[] bytes, String sha256) {
        public Encoded { bytes = bytes.clone(); }
        @Override public byte[] bytes() { return bytes.clone(); }
        @Override public String toString() { return "RenderManifest.Encoded[redacted]"; }
    }

    private static final class BoundedOutput extends OutputStream {
        private final int limit;
        private final ByteArrayOutputStream output = new ByteArrayOutputStream();

        private BoundedOutput(int limit) { this.limit = limit; }

        @Override public void write(int value) throws IOException {
            reserve(1);
            output.write(value);
        }

        @Override public void write(byte[] bytes, int offset, int length) throws IOException {
            reserve(length);
            output.write(bytes, offset, length);
        }

        private void reserve(int size) throws IOException {
            if (size > limit - output.size()) throw new IOException("manifest-limit");
        }

        private byte[] bytes() { return output.toByteArray(); }
    }
}
