package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import tools.jackson.databind.node.ObjectNode;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
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
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class RenderManifestServiceTest {
    private static final ObjectMapper MAPPER = GatewayJsonMapper.create();
    private static final String SOURCE = "日本語 <script>fixture</script>\n😀 ";
    private static final String TARGET = "  português & <img onerror=fixture>\n😀 ";
    private static final RenderManifestService SERVICE = new RenderManifestService(MAPPER);
    private static final RenderPolicy POLICY = RenderPolicy.initial();
    private static final RenderRequest REQUEST = request(POLICY, SOURCE, TARGET);
    private static final RenderedImage IMAGE = new RenderedImage("image/webp", 100, 100, 80, "d".repeat(64));

    @Test
    void roundTripsCompleteFallbackAndGeometryWithVerifiedBindings() throws Exception {
        var manifest = manifest(REQUEST);
        var encoded = SERVICE.encode(manifest, REQUEST.policy());
        var decoded = SERVICE.decode(encoded.bytes(), encoded.sha256(), REQUEST, IMAGE);

        assertThat(decoded.version()).isEqualTo("1.0");
        assertThat(decoded.policyVersion()).isEqualTo(POLICY.version());
        assertThat(decoded.jobRef()).isEqualTo(REQUEST.jobRef());
        assertThat(decoded.regions()).isEqualTo(manifest.regions());
        assertThat(decoded.regions().getFirst().sourceText()).isEqualTo(SOURCE);
        assertThat(decoded.regions().getFirst().translatedText()).isEqualTo(TARGET);
        assertThat(decoded.regions().getFirst().overflow()).isTrue();
        assertThat(decoded.image()).isEqualTo(IMAGE);
        assertThat(hash(encoded.bytes())).isEqualTo(encoded.sha256());
        assertThat(MAPPER.readTree(encoded.bytes()).get("regions").get(0).get("translatedText").asText()).isEqualTo(TARGET);
        var copy = encoded.bytes();
        copy[0] = 0;
        assertThat(encoded.bytes()[0]).isNotZero();
        assertThat(encoded.toString()).doesNotContain(SOURCE, TARGET, encoded.sha256());
    }

    @ParameterizedTest
    @MethodSource("mutations")
    void rejectsInconsistentUnknownMissingAndCoercedFieldsWithoutContentInFailures(Consumer<ObjectNode> mutation) throws Exception {
        ObjectNode json = (ObjectNode) MAPPER.readTree(SERVICE.encode(manifest(REQUEST), POLICY).bytes());
        mutation.accept(json);
        byte[] bytes = MAPPER.writeValueAsBytes(json);
        invalid(() -> SERVICE.decode(bytes, hash(bytes), REQUEST, IMAGE));
    }

    @Test
    void rejectsWrongHashInvalidUtf8AlternateEncodingDuplicatesAndTrailingValues() {
        var encoded = SERVICE.encode(manifest(REQUEST), POLICY);
        invalid(() -> SERVICE.decode(encoded.bytes(), "e".repeat(64), REQUEST, IMAGE));
        invalid(() -> SERVICE.decode(encoded.bytes(), null, REQUEST, IMAGE));
        invalid(() -> SERVICE.decode(encoded.bytes(), encoded.sha256().toUpperCase(), REQUEST, IMAGE));
        invalid(() -> SERVICE.decode(encoded.bytes(), encoded.sha256(), null, IMAGE));
        invalid(() -> SERVICE.decode(encoded.bytes(), encoded.sha256(), REQUEST, null));
        invalid(() -> SERVICE.decode(null, encoded.sha256(), REQUEST, IMAGE));
        invalid(() -> SERVICE.decode(new byte[0], hash(new byte[0]), REQUEST, IMAGE));
        var raw = new String(encoded.bytes(), StandardCharsets.UTF_8);
        invalidBytes(new byte[] {(byte) 0xc3, (byte) 0x28});
        invalidBytes(raw.getBytes(StandardCharsets.UTF_16));
        invalidBytes((raw + " {}").getBytes(StandardCharsets.UTF_8));
        invalidBytes(raw.replace("\"version\":\"1.0\"", "\"version\":\"1.0\",\"version\":\"1.0\"").getBytes(StandardCharsets.UTF_8));
        invalidBytes(raw.replace("\"overflow\":true", "\"overflow\":true,\"overflow\":true").getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void enforcesExactEncodedBytesAndDoesNotTruncateExpandingEscapedText() {
        var manifest = manifest(REQUEST);
        var bytes = SERVICE.encode(manifest, POLICY).bytes();
        var exact = policy(bytes.length);
        assertThat(SERVICE.encode(manifest, exact).bytes()).isEqualTo(bytes);
        invalid(() -> SERVICE.encode(manifest, policy(bytes.length - 1)));
        var narrowRequest = request(policy(bytes.length - 1), SOURCE, TARGET);
        invalid(() -> SERVICE.decode(bytes, hash(bytes), narrowRequest, IMAGE));
        invalid(() -> SERVICE.encode(null, POLICY));
        invalid(() -> SERVICE.encode(manifest, null));
        var different = new RenderPolicy("different-1.0", 100, 100, 80, 8000, 100,
            POLICY.maxManifestBytes(), 12, 48, 2);
        invalid(() -> SERVICE.encode(manifest, different));
        var escaped = request(POLICY, "\u0001".repeat(4095) + "x", "\u0001".repeat(8191) + "x");
        var escapedBytes = SERVICE.encode(manifest(escaped), POLICY);
        assertThat(escapedBytes.bytes().length).isGreaterThan(4096 + 8192);
        assertThat(SERVICE.decode(escapedBytes.bytes(), escapedBytes.sha256(), escaped, IMAGE)
            .regions().getFirst().translatedText()).isEqualTo("\u0001".repeat(8191) + "x");
    }

    @Test
    void handlesGenuineEmptyPageAndRejectsInventedFallback() throws Exception {
        var pair = new LanguagePair("ja", "pt-BR");
        var job = UUID.randomUUID();
        var translation = new TranslationValidator(Set.of(pair)).validateResponse(
            new TranslationRequest(job, pair, List.of()), new TranslationResponse(List.of()));
        var request = RenderRequest.create(REQUEST.source(), new OcrManifest("1.0", job, "ja", 100, 80, List.of()),
            translation, REQUEST.ocrSha256(), REQUEST.translationSha256(), POLICY);
        var encoded = SERVICE.encode(RenderManifest.create(request, IMAGE, List.of()), POLICY);
        assertThat(SERVICE.decode(encoded.bytes(), encoded.sha256(), request, IMAGE).regions()).isEmpty();
        ObjectNode json = (ObjectNode) MAPPER.readTree(encoded.bytes());
        json.withArray("regions").add(MAPPER.readTree(SERVICE.encode(manifest(REQUEST), POLICY).bytes()).get("regions").get(0));
        var invented = MAPPER.writeValueAsBytes(json);
        invalid(() -> SERVICE.decode(invented, hash(invented), request, IMAGE));
    }

    @Test
    void rejectsWholeManifestAboveFourMebibytesEvenWhenTextUnitsAreWithinLimits() {
        var job = UUID.randomUUID();
        var pair = new LanguagePair("ja", "pt-BR");
        var sources = new ArrayList<TranslationRequest.Region>();
        var targets = new ArrayList<TranslationResponse.Region>();
        var regions = new ArrayList<OcrManifest.Region>();
        var polygon = REQUEST.regions().getFirst().polygon();
        for (int order = 0; order < 64; order++) {
            var id = UUID.randomUUID();
            var source = "\u0001".repeat(4095) + "x";
            sources.add(new TranslationRequest.Region(id, order, source));
            targets.add(new TranslationResponse.Region(id, "\u0001".repeat(8191) + "x"));
            regions.add(new OcrManifest.Region(id, order, source, polygon));
        }
        var translated = new TranslationValidator(Set.of(pair)).validateResponse(
            new TranslationRequest(job, pair, sources), new TranslationResponse(targets));
        var request = RenderRequest.create(REQUEST.source(), new OcrManifest("1.0", job, "ja", 100, 80, regions),
            translated, REQUEST.ocrSha256(), REQUEST.translationSha256(), POLICY);
        var manifest = RenderManifest.create(request, IMAGE, regions.stream()
            .map(region -> new RenderManifest.Placement(region.id(), true, 0)).toList());
        invalid(() -> SERVICE.encode(manifest, POLICY));
    }

    private static Stream<Consumer<ObjectNode>> mutations() {
        return Stream.of(
            node -> node.put("version", "2.0"), node -> node.put("policyVersion", "other-1.0"),
            node -> node.put("jobRef", UUID.randomUUID().toString()), node -> node.put("sourceLanguage", "zh-Hant"),
            node -> node.put("targetLanguage", "pt"), node -> node.put("originalSha256", "e".repeat(64)),
            node -> node.put("ocrSha256", "e".repeat(64)), node -> node.put("translationSha256", "e".repeat(64)),
            node -> node.put("extra", TARGET), node -> node.remove("version"), node -> node.putNull("image"),
            node -> ((ObjectNode) node.get("image")).put("widthPx", "100"),
            node -> ((ObjectNode) node.get("image")).put("byteSize", 101),
            node -> ((ObjectNode) node.get("image")).put("sha256", "e".repeat(64)),
            node -> ((ObjectNode) node.get("image")).put("widthPx", 100.5),
            node -> ((ObjectNode) node.get("image")).putNull("heightPx"),
            node -> ((ObjectNode) node.get("regions").get(0)).put("sourceText", "changed"),
            node -> ((ObjectNode) node.get("regions").get(0)).put("translatedText", "changed"),
            node -> ((ObjectNode) node.get("regions").get(0)).put("id", UUID.randomUUID().toString()),
            node -> ((ObjectNode) node.get("regions").get(0)).put("readingOrder", 1),
            node -> ((ObjectNode) node.get("regions").get(0)).put("readingOrder", "0"),
            node -> ((ObjectNode) node.get("regions").get(0)).remove("overflow"),
            node -> ((ObjectNode) node.get("regions").get(0)).putNull("overflow"),
            node -> ((ObjectNode) node.get("regions").get(0)).put("overflow", "true"),
            node -> ((ObjectNode) node.get("regions").get(0)).put("fontSizePx", 12),
            node -> ((ObjectNode) node.get("regions").get(0).get("polygon").get(0)).put("x", 0.2),
            node -> ((ObjectNode) node.get("regions").get(0).get("polygon").get(0)).put("x", "0.1"));
    }

    private static RenderRequest request(RenderPolicy policy, String source, String target) {
        var job = UUID.randomUUID();
        var id = UUID.randomUUID();
        var pair = new LanguagePair("ja", "pt-BR");
        var polygon = List.of(new OcrManifest.Vertex(0.1, 0.1), new OcrManifest.Vertex(0.8, 0.1),
            new OcrManifest.Vertex(0.8, 0.8), new OcrManifest.Vertex(0.1, 0.8));
        var ocr = new OcrManifest("1.0", job, "ja", 100, 80, List.of(new OcrManifest.Region(id, 0, source, polygon)));
        var translation = new TranslationValidator(Set.of(pair)).validateResponse(
            new TranslationRequest(job, pair, List.of(new TranslationRequest.Region(id, 0, source))),
            new TranslationResponse(List.of(new TranslationResponse.Region(id, target))));
        return RenderRequest.create(new RenderSource("image/png", 100, 100, 80, "a".repeat(64)), ocr,
            translation, "b".repeat(64), "c".repeat(64), policy);
    }

    private static RenderManifest manifest(RenderRequest request) {
        return RenderManifest.create(request, IMAGE, List.of(new RenderManifest.Placement(request.regions().getFirst().id(), true, 0)));
    }

    private static RenderPolicy policy(int bytes) {
        return new RenderPolicy(POLICY.version(), 100, 100, 80, 8000, 100, bytes, 12, 48, 2);
    }

    private static String hash(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (Exception error) { throw new AssertionError(error); }
    }

    private static void invalidBytes(byte[] bytes) { invalid(() -> SERVICE.decode(bytes, hash(bytes), REQUEST, IMAGE)); }
    private static void invalid(Runnable action) {
        assertThatThrownBy(action::run).isInstanceOf(RenderValidationException.class)
            .hasMessage("INVALID_OUTPUT").hasNoCause();
    }
}
