package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class TranslationManifestServiceTest {
    private static final UUID JOB = UUID.fromString("10000000-0000-4000-8000-000000000001");
    private static final UUID FIRST = UUID.fromString("20000000-0000-4000-8000-000000000001");
    private static final UUID SECOND = UUID.fromString("20000000-0000-4000-8000-000000000002");
    private static final String OCR_HASH = "a".repeat(64);
    private static final String TEXT = "简体\n<b>texto</b> 😀";
    private final ObjectMapper mapper = GatewayJsonMapper.create().rebuild().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
    private final TranslationManifestService service = new TranslationManifestService(mapper);
    private final TranslationValidator validator = new TranslationValidator(Set.copyOf(LanguagePair.all()));

    private TranslationRequest request() {
        return new TranslationRequest(JOB, new LanguagePair("zh-Hant", "zh-Hans"), List.of(
            new TranslationRequest.Region(FIRST, 0, "繁體 原文"), new TranslationRequest.Region(SECOND, 1, "第二段")));
    }

    private byte[] encoded() {
        return service.encode(validator.validateResponse(request(), new TranslationResponse(List.of(
            new TranslationResponse.Region(SECOND, "第二段译文"), new TranslationResponse.Region(FIRST, TEXT)))), OCR_HASH).bytes();
    }

    @Test
    void roundTripsValidatedBytesAndPreservesTextOrderVariantsAndImmutability() throws Exception {
        byte[] bytes = encoded();
        var result = service.decode(bytes, hash(bytes), request(), OCR_HASH);
        assertThat(result.jobRef()).isEqualTo(JOB);
        assertThat(result.pair()).isEqualTo(new LanguagePair("zh-Hant", "zh-Hans"));
        assertThat(result.regions()).extracting(region -> region.id()).containsExactly(FIRST, SECOND);
        assertThat(result.regions().getFirst().translatedText()).isEqualTo(TEXT);
        assertThatThrownBy(() -> result.regions().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThat(result.toString()).isEqualTo("TranslationResult[redacted]");
    }

    @Test
    void associatesReorderedRegionsUsingTheirIdsWithoutChangingReadingOrder() throws Exception {
        var tree = mapper.readTree(encoded());
        var regions = (ArrayNode) tree.get("regions");
        var first = regions.remove(0); regions.add(first);
        byte[] bytes = mapper.writeValueAsBytes(tree);
        var result = service.decode(bytes, hash(bytes), request(), OCR_HASH);
        assertThat(result.regions()).extracting(region -> region.id()).containsExactly(FIRST, SECOND);
        assertThat(result.regions().getFirst().translatedText()).isEqualTo(TEXT);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "unknown", "version", "model", "job", "source", "target", "ocr", "missing", "duplicate", "extra",
        "blank", "oversized", "wrong-order", "geometry", "null-order", "string-order", "float-order", "missing-order"
    })
    void rejectsInvalidMetadataRegionsAndCoercionDespitePermissiveApplicationMapper(String kind) throws Exception {
        var tree = (ObjectNode) mapper.readTree(encoded());
        var regions = (ArrayNode) tree.get("regions");
        var first = (ObjectNode) regions.get(0);
        switch (kind) {
            case "unknown" -> tree.put("privateProviderDetails", "secret");
            case "version" -> tree.put("version", "2.0");
            case "model" -> tree.put("model", "general/nmt");
            case "job" -> tree.put("jobRef", UUID.randomUUID().toString());
            case "source" -> tree.put("sourceLanguage", "zh-Hans");
            case "target" -> tree.put("targetLanguage", "zh-Hant");
            case "ocr" -> tree.put("ocrManifestSha256", "b".repeat(64));
            case "missing" -> regions.remove(1);
            case "duplicate" -> regions.set(1, first.deepCopy());
            case "extra" -> first.put("id", UUID.randomUUID().toString());
            case "blank" -> first.put("translatedText", " \n\t");
            case "oversized" -> first.put("translatedText", "x".repeat(8193));
            case "wrong-order" -> first.put("readingOrder", 1);
            case "geometry" -> first.putArray("polygon");
            case "null-order" -> first.putNull("readingOrder");
            case "string-order" -> first.put("readingOrder", "0");
            case "float-order" -> first.put("readingOrder", 0.5);
            case "missing-order" -> first.remove("readingOrder");
            default -> throw new AssertionError(kind);
        }
        byte[] bytes = mapper.writeValueAsBytes(tree);
        assertInvalid(bytes, hash(bytes), request(), OCR_HASH);
    }

    @Test
    void rejectsTamperingAndInvalidExpectedHashesWithoutRawCauses() throws Exception {
        byte[] bytes = encoded();
        assertInvalid(bytes, "b".repeat(64), request(), OCR_HASH);
        assertInvalid(bytes, "A".repeat(64), request(), OCR_HASH);
        assertInvalid(bytes, null, request(), OCR_HASH);
        assertInvalid(bytes, hash(bytes), request(), "wrong");
        assertInvalid(bytes, hash(bytes), null, OCR_HASH);
    }

    @Test
    void rejectsDuplicateKeysTrailingDocumentsInvalidUtf8AndNonUtf8Json() throws Exception {
        String json = new String(encoded(), StandardCharsets.UTF_8);
        byte[] duplicate = json.replace("\"version\":\"1.0\"", "\"version\":\"1.0\",\"version\":\"1.0\"").getBytes(StandardCharsets.UTF_8);
        assertInvalid(duplicate, hash(duplicate), request(), OCR_HASH);
        byte[] trailing = (json + "{}").getBytes(StandardCharsets.UTF_8);
        assertInvalid(trailing, hash(trailing), request(), OCR_HASH);
        byte[] malformed = { (byte) 0xc3, (byte) 0x28 };
        assertInvalid(malformed, hash(malformed), request(), OCR_HASH);
        byte[] utf16 = json.getBytes(StandardCharsets.UTF_16LE);
        assertInvalid(utf16, hash(utf16), request(), OCR_HASH);
    }

    @Test
    void acceptsAnEmptyPageOnlyWithAnEmptyResponse() throws Exception {
        var request = new TranslationRequest(JOB, new LanguagePair("pt-BR", "en"), List.of());
        byte[] bytes = service.encode(validator.validateResponse(request, new TranslationResponse(List.of())), OCR_HASH).bytes();
        assertThat(service.decode(bytes, hash(bytes), request, OCR_HASH).regions()).isEmpty();
        assertInvalid(encoded(), hash(encoded()), request, OCR_HASH);
    }

    @Test
    void rejectsEmptyNullAndOversizedBytes() throws Exception {
        assertInvalid(null, "a".repeat(64), request(), OCR_HASH);
        assertInvalid(new byte[0], hash(new byte[0]), request(), OCR_HASH);
        byte[] bytes = new byte[4 * 1024 * 1024 + 1];
        assertInvalid(bytes, hash(bytes), request(), OCR_HASH);
    }

    @Test
    void acceptsExactByteLimitAndUtf8BomWithoutChangingContentOrTheApplicationMapper() throws Exception {
        byte[] bytes = encoded();
        String json = new String(bytes, StandardCharsets.UTF_8);
        byte[] atLimit = (" ".repeat(4 * 1024 * 1024 - bytes.length) + json).getBytes(StandardCharsets.UTF_8);
        assertThat(atLimit).hasSize(4 * 1024 * 1024);
        assertThat(service.decode(atLimit, hash(atLimit), request(), OCR_HASH).regions().getFirst().translatedText()).isEqualTo(TEXT);
        byte[] bom = ("\uFEFF" + json).getBytes(StandardCharsets.UTF_8);
        assertThat(service.decode(bom, hash(bom), request(), OCR_HASH).regions().getFirst().translatedText()).isEqualTo(TEXT);
        assertThat(mapper.isEnabled(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)).isFalse();
        assertThat(mapper.isEnabled(DeserializationFeature.ACCEPT_FLOAT_AS_INT)).isTrue();
    }

    @Test
    void validatesExactUtf16ExpansionLimitAndPageTotalWithoutTruncation() throws Exception {
        var regions = IntStream.range(0, 64).mapToObj(index -> new TranslationRequest.Region(
            UUID.fromString("20000000-0000-4000-8000-" + String.format("%012d", index + 1)), index, "源")).toList();
        var request = new TranslationRequest(JOB, new LanguagePair("ja", "pt-BR"), regions);
        String text = "😀".repeat(4096);
        var response = new TranslationResponse(regions.stream().map(region -> new TranslationResponse.Region(region.id(), text)).toList());
        byte[] bytes = service.encode(validator.validateResponse(request, response), OCR_HASH).bytes();
        var result = service.decode(bytes, hash(bytes), request, OCR_HASH);
        assertThat(result.regions()).hasSize(64).allMatch(region -> region.translatedText().equals(text));

        var tree = (ObjectNode) mapper.readTree(bytes);
        var extra = ((ObjectNode) tree.get("regions").get(0)).deepCopy();
        extra.put("id", UUID.randomUUID().toString()); extra.put("readingOrder", 64);
        ((ArrayNode) tree.get("regions")).add(extra);
        var expanded = new ArrayList<>(regions);
        expanded.add(new TranslationRequest.Region(UUID.fromString(extra.get("id").asText()), 64, "源"));
        var expected = new TranslationRequest(JOB, new LanguagePair("ja", "pt-BR"), expanded);
        byte[] oversized = mapper.writeValueAsBytes(tree);
        assertInvalid(oversized, hash(oversized), expected, OCR_HASH);
    }

    private void assertInvalid(byte[] bytes, String manifestHash, TranslationRequest request, String ocrHash) {
        assertThatThrownBy(() -> service.decode(bytes, manifestHash, request, ocrHash))
            .isInstanceOf(GatewayException.class)
            .hasMessage(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE.value())
            .hasNoCause();
    }

    private static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
}
