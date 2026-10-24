package com.toonlira.translationgateway.application;

import tools.jackson.core.JacksonException;
import tools.jackson.core.StreamReadFeature;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.ObjectReader;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.TranslationManifest;
import com.toonlira.translationgateway.domain.translation.TranslationResult;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class TranslationManifestService {
    private static final int MAX_BYTES = 4 * 1024 * 1024;
    private static final String MODEL = "general/translation-llm";
    private final ObjectMapper mapper;
    private final ObjectReader reader;
    private final TranslationValidator validator = new TranslationValidator(Set.copyOf(LanguagePair.all()));

    public TranslationManifestService(ObjectMapper mapper) {
        this.mapper = mapper;
        var strict = mapper.rebuild().disable(MapperFeature.ALLOW_COERCION_OF_SCALARS).build();
        this.reader = strict.readerFor(TranslationManifest.class)
            .with(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
                DeserializationFeature.FAIL_ON_TRAILING_TOKENS,
                DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES,
                DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES,
                DeserializationFeature.FAIL_ON_NULL_CREATOR_PROPERTIES)
            .without(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
            .with(StreamReadFeature.STRICT_DUPLICATE_DETECTION);
    }

    public TranslationResult decode(byte[] bytes, String manifestSha256, TranslationRequest request, String ocrSha256) {
        try {
            if (bytes == null || bytes.length == 0 || bytes.length > MAX_BYTES
                || manifestSha256 == null || !manifestSha256.matches("[0-9a-f]{64}")
                || ocrSha256 == null || !ocrSha256.matches("[0-9a-f]{64}")) invalid();
            validator.validateRequest(request);
            byte[] snapshot = bytes.clone();
            if (!MessageDigest.isEqual(MessageDigest.getInstance("SHA-256").digest(snapshot),
                HexFormat.of().parseHex(manifestSha256))) invalid();
            String json = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(snapshot)).toString();
            // Decode text, not auto-detected bytes: a valid hash cannot authorize UTF-16 JSON.
            if (json.startsWith("\uFEFF")) json = json.substring(1);
            TranslationManifest manifest = reader.readValue(json);
            if (!"1.0".equals(manifest.version()) || !MODEL.equals(manifest.model())
                || !request.jobRef().equals(manifest.jobRef())
                || !request.pair().source().equals(manifest.sourceLanguage())
                || !request.pair().target().equals(manifest.targetLanguage())
                || !ocrSha256.equals(manifest.ocrManifestSha256())) invalid();
            var orders = new HashMap<UUID, Integer>();
            request.regions().forEach(region -> orders.put(region.id(), region.readingOrder()));
            for (var region : manifest.regions()) {
                if (!Integer.valueOf(region.readingOrder()).equals(orders.get(region.id()))) invalid();
            }
            return validator.validateResponse(request, new TranslationResponse(manifest.regions().stream()
                .map(region -> new TranslationResponse.Region(region.id(), region.translatedText())).toList()));
        } catch (IOException | RuntimeException | NoSuchAlgorithmException error) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
        }
    }

    public Encoded encode(TranslationResult result, String ocrSha256) {
        if (result == null || ocrSha256 == null || !ocrSha256.matches("[0-9a-f]{64}")) invalid();
        var manifest = new TranslationManifest("1.0", result.jobRef(), result.pair().source(),
            result.pair().target(), ocrSha256, MODEL, result.regions().stream()
                .map(region -> new TranslationManifest.Region(region.id(), region.readingOrder(), region.translatedText()))
                .toList());
        try {
            var bytes = mapper.writeValueAsBytes(manifest);
            if (bytes.length > MAX_BYTES) invalid();
            var hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            return new Encoded(bytes, hash);
        } catch (JacksonException | NoSuchAlgorithmException error) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
        }
    }

    private static void invalid() {
        throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
    }

    public record Encoded(byte[] bytes, String sha256) {
        public Encoded { bytes = bytes.clone(); }
        @Override public byte[] bytes() { return bytes.clone(); }
    }
}
