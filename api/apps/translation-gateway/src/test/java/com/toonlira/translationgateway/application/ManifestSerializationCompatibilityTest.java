package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationResult;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Synthetic byte-level fixtures frozen before the Boot/Jackson migration. */
class ManifestSerializationCompatibilityTest {
    private static final UUID JOB = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID REGION = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final String SOURCE = "漢字 <>&\n😀";
    private static final String TARGET = "Olá <>&\n😀";
    private static final String SOURCE_JSON = "漢字 <>&\\n\\uD83D\\uDE00";
    private static final String TARGET_JSON = "Olá <>&\\n\\uD83D\\uDE00";
    private static final String POLYGON_JSON = "[{\"x\":0.1,\"y\":0.1},{\"x\":0.8,\"y\":0.1},"
        + "{\"x\":0.8,\"y\":0.8},{\"x\":0.1,\"y\":0.8}]";
    private static final LanguagePair PAIR = new LanguagePair("ja", "pt-BR");
    private static final ObjectMapper MAPPER = GatewayJsonMapper.create();

    @Test void preservesOcrBytesHashAndReadingOrder() throws Exception {
        var service = new OcrManifestService(MAPPER);
        var encoded = service.encode(ocr());
        String expected = "{\"version\":\"1.0\",\"jobRef\":\"" + JOB
            + "\",\"sourceLanguage\":\"ja\",\"widthPx\":100,\"heightPx\":80,\"regions\":[{\"id\":\""
            + REGION + "\",\"readingOrder\":0,\"sourceText\":\"" + SOURCE_JSON
            + "\",\"polygon\":" + POLYGON_JSON + "}]}";
        bytesAndHash(encoded.bytes(), encoded.sha256(), expected);
        assertThat(service.decode(expected.getBytes(StandardCharsets.UTF_8))).isEqualTo(ocr());
    }

    @Test void preservesTranslationBytesHashAndSourceBinding() throws Exception {
        var service = new TranslationManifestService(MAPPER);
        var result = translation();
        var encoded = service.encode(result, "b".repeat(64));
        String expected = "{\"version\":\"1.0\",\"jobRef\":\"" + JOB
            + "\",\"sourceLanguage\":\"ja\",\"targetLanguage\":\"pt-BR\",\"ocrManifestSha256\":\""
            + "b".repeat(64) + "\",\"model\":\"general/translation-llm\",\"regions\":[{\"id\":\""
            + REGION + "\",\"readingOrder\":0,\"translatedText\":\"" + TARGET_JSON + "\"}]}";
        bytesAndHash(encoded.bytes(), encoded.sha256(), expected);
        assertThat(service.decode(expected.getBytes(StandardCharsets.UTF_8), encoded.sha256(),
            request(), "b".repeat(64)).regions()).isEqualTo(result.regions());
    }

    @Test void preservesRenderBytesHashGeometryAndFallback() throws Exception {
        var service = new RenderManifestService(MAPPER);
        var policy = RenderPolicy.initial();
        var request = RenderRequest.create(new RenderSource("image/png", 100, 100, 80, "a".repeat(64)),
            ocr(), translation(), "b".repeat(64), "c".repeat(64), policy);
        var image = new RenderedImage("image/webp", 100, 100, 80, "d".repeat(64));
        var manifest = RenderManifest.create(request, image, List.of(new RenderManifest.Placement(REGION, true, 0)));
        var encoded = service.encode(manifest, policy);
        String expected = "{\"version\":\"1.0\",\"policyVersion\":\"clean-box-1.1\",\"jobRef\":\"" + JOB
            + "\",\"sourceLanguage\":\"ja\",\"targetLanguage\":\"pt-BR\",\"originalSha256\":\"" + "a".repeat(64)
            + "\",\"ocrSha256\":\"" + "b".repeat(64) + "\",\"translationSha256\":\"" + "c".repeat(64)
            + "\",\"image\":{\"mimeType\":\"image/webp\",\"byteSize\":100,\"widthPx\":100,\"heightPx\":80,\"sha256\":\""
            + "d".repeat(64) + "\"},\"regions\":[{\"id\":\"" + REGION
            + "\",\"readingOrder\":0,\"sourceText\":\"" + SOURCE_JSON + "\",\"translatedText\":\"" + TARGET_JSON
            + "\",\"polygon\":" + POLYGON_JSON + ",\"overflow\":true,\"fontSizePx\":0}]}";
        bytesAndHash(encoded.bytes(), encoded.sha256(), expected);
        assertThat(service.decode(expected.getBytes(StandardCharsets.UTF_8), encoded.sha256(), request, image)
            .regions()).isEqualTo(manifest.regions());
    }

    private static OcrManifest ocr() {
        var polygon = List.of(new OcrManifest.Vertex(0.1, 0.1), new OcrManifest.Vertex(0.8, 0.1),
            new OcrManifest.Vertex(0.8, 0.8), new OcrManifest.Vertex(0.1, 0.8));
        return new OcrManifest("1.0", JOB, "ja", 100, 80, List.of(new OcrManifest.Region(REGION, 0, SOURCE, polygon)));
    }

    private static TranslationRequest request() {
        return new TranslationRequest(JOB, PAIR, List.of(new TranslationRequest.Region(REGION, 0, SOURCE)));
    }

    private static TranslationResult translation() {
        return new TranslationValidator(Set.of(PAIR)).validateResponse(request(),
            new TranslationResponse(List.of(new TranslationResponse.Region(REGION, TARGET))));
    }

    private static void bytesAndHash(byte[] actual, String actualHash, String expected) throws Exception {
        byte[] bytes = expected.getBytes(StandardCharsets.UTF_8);
        assertThat(actual).isEqualTo(bytes);
        assertThat(actualHash).isEqualTo(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)));
    }
}
