package com.toonlira.translationgateway.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;

class TranslationGatewayOpenApiTest {
    /** MOB-FEAT-022/023 over v2: optional opaque chapter reference, bounded glossary, disclosed language model. */
    @Test
    void chapterContextGlossaryAndLanguageModelAreInTheVolatileContract() throws IOException {
        Map<String, Object> contract;
        try (var reader = Files.newBufferedReader(CONTRACT)) {
            // Strict: a repeated key would otherwise keep only the last one silently.
            var options = new org.yaml.snakeyaml.LoaderOptions();
            options.setAllowDuplicateKeys(false);
            contract = map(new org.yaml.snakeyaml.Yaml(options).load(reader));
        }
        var parameters = map(map(contract.get("components")).get("parameters"));
        var context = map(parameters.get("ContextRef"));
        assertThat(context).containsEntry("name", "X-Context-Ref").containsEntry("in", "header").containsEntry("required", false);
        assertThat(map(context.get("schema"))).containsEntry("format", "uuid");
        var glossary = map(map(map(contract.get("paths")).get("/v2/page-translations/chapter-contexts/{contextRef}/glossary")).get("put"));
        assertThat(map(glossary.get("responses"))).containsKeys("204", "400", "409", "413");
        var schemas = map(map(contract.get("components")).get("schemas"));
        assertThat(map(schemas.get("ChapterGlossary"))).containsEntry("maxItems", 256);
        var disclosure = map(schemas.get("LegalDisclosure"));
        assertThat(list(disclosure.get("required"))).contains("languageModelLocation");
        assertThat(list(map(map(disclosure.get("properties")).get("languageModelLocation")).get("oneOf"))).hasSize(2);
    }

    private static final Path CONTRACT = Path.of("openapi", "translation-gateway-v2.yaml");
    private static final Path IDENTITY = Path.of("openapi", "translation-gateway-v1.yaml");

    @Test void publishesDirectBinaryExecutionAndMetadataOnlyRecovery() throws IOException {
        var contract = load(CONTRACT);
        var paths = map(contract.get("paths"));
        assertThat(paths).containsOnlyKeys("/v1/anonymous/installations", "/v1/anonymous/sessions", "/v2/capabilities",
            "/v2/page-translations", "/v2/page-translations/by-idempotency/{key}",
            "/v2/page-translations/chapter-contexts/{contextRef}/glossary");
        var post = map(map(paths.get("/v2/page-translations")).get("post"));
        assertThat(map(map(post.get("requestBody")).get("content")))
            .containsOnlyKeys("image/jpeg", "image/png", "image/webp");
        var result = map(map(map(post.get("responses")).get("200")).get("content"));
        assertThat(result).containsOnlyKeys("application/vnd.toonlira.translation+binary");
        var key = map(map(map(contract.get("components")).get("parameters")).get("IdempotencyKey"));
        assertThat(key).containsEntry("in", "header").containsEntry("required", true);
        assertThat(map(key.get("schema")).get("pattern").toString()).contains("-7", "89abAB");
        var receipt = schema(contract, "Receipt");
        assertThat(receipt).containsEntry("additionalProperties", false);
        assertThat(map(receipt.get("properties"))).containsOnlyKeys("operationRef", "status", "createdAt", "finishedAt", "errorCode");
        assertThat(map(map(schema(contract, "ReceiptEnvelope").get("properties")).get("contentRecoverable")))
            .containsEntry("const", false);
        assertThat(list(schema(contract, "ReceiptStatus").get("enum"))).containsExactly("STARTED", "FINISHED", "FAILED");
    }

    @Test void publishesTruthfulVolatileDisclosureAndAbsoluteReceiptValidity() throws IOException {
        var properties = map(schema(load(CONTRACT), "LegalDisclosure").get("properties"));
        for (var entry : Map.of("ocrRegion", "us", "translationLocation", "global", "contentProcessing", "in-memory-only",
            "resultStorage", "user-device", "idempotencyKeyFormat", "uuid-v7").entrySet())
            assertThat(map(properties.get(entry.getKey()))).containsEntry("const", entry.getValue());
        assertThat(map(properties.get("sanitizedOperationalLogs"))).containsEntry("const", true);
        assertThat(map(properties.get("receiptValiditySeconds"))).containsEntry("const", 604800);
        assertThat(properties).doesNotContainKeys("originalRetentionSeconds", "resultRetentionSeconds", "metadataRetentionDays");
    }

    @Test void preservesLimitsLanguagesAndExplicitOperationalPairs() throws IOException {
        var contract = load(CONTRACT);
        assertThat(list(schema(contract, "TranslationLanguage").get("enum")))
            .containsExactly("ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR");
        var limits = map(schema(contract, "MediaLimits").get("properties"));
        for (var entry : Map.of("maxBytes", 12582912, "maxPixels", 80000000, "maxWidthPx", 12000,
            "maxHeightPx", 12000, "maxResultBytes", 67108864, "maxManifestBytes", 4194304).entrySet())
            assertThat(map(limits.get(entry.getKey()))).containsEntry("maximum", entry.getValue());
        var caps = schema(contract, "Capabilities");
        var pairs = map(map(caps.get("properties")).get("supportedPairs"));
        assertThat(pairs).containsEntry("minItems", 0).containsEntry("maxItems", 42).containsEntry("uniqueItems", true);
        var rule = map(list(caps.get("allOf")).iterator().next());
        assertThat(map(map(map(rule.get("then")).get("properties")).get("supportedPairs"))).containsEntry("minItems", 1);
    }

    @Test void protectsExecutionAndReceiptsAndForbidsResponseCaching() throws IOException {
        var paths = map(load(CONTRACT).get("paths"));
        for (var entry : Map.of("/v2/capabilities", "get", "/v2/page-translations", "post", "/v2/page-translations/by-idempotency/{key}", "get").entrySet()) {
            var operation = map(map(paths.get(entry.getKey())).get(entry.getValue()));
            if (!entry.getKey().endsWith("capabilities"))
                assertThat(map(list(operation.get("security")).iterator().next())).containsKey("anonymousSession");
            var success = map(map(operation.get("responses")).get("200"));
            assertThat(map(map(map(success.get("headers")).get("Cache-Control")).get("schema"))).containsEntry("const", "no-store");
        }
    }

    @Test void retiredV1ContentRoutesOnlyAdvertiseGoneAndKeepIdentity() throws IOException {
        var contract = load(IDENTITY);
        var paths = map(contract.get("paths"));
        assertThat(paths).containsKeys("/v1/anonymous/installations", "/v1/anonymous/sessions");
        paths.forEach((path, value) -> {
            if (path.startsWith("/v1/anonymous/")) return;
            map(value).forEach((method, operation) -> {
                if (method.equals("parameters")) return;
                var gone = map(operation);
                assertThat(gone).containsEntry("deprecated", true).doesNotContainKey("requestBody");
                assertThat(map(gone.get("responses"))).containsOnlyKeys("410");
            });
        });
        assertThat(map(map(contract.get("components")).get("schemas")))
            .doesNotContainKeys("ReadyResult", "PrivateResultDownload", "PageSubmission");
    }

    @Test void resolvesAllReferencesInBothCurrentContracts() throws IOException {
        for (var path : new Path[]{CONTRACT, IDENTITY}) assertReferences(load(path), load(path));
    }

    private Map<String, Object> load(Path path) throws IOException {
        try (var reader = Files.newBufferedReader(path)) { return map(new Yaml().load(reader)); }
    }
    private Map<String, Object> schema(Map<String, Object> root, String name) {
        return map(map(map(root.get("components")).get("schemas")).get(name));
    }
    private void assertReferences(Object node, Map<String, Object> root) throws IOException {
        if (node instanceof Map<?, ?> entries) {
            for (var entry : entries.entrySet()) {
                if ("$ref".equals(entry.getKey())) {
                    var reference = entry.getValue().toString();
                    var target = root;
                    if (!reference.startsWith("#/")) {
                        assertThat(reference).startsWith("./translation-gateway-v1.yaml#/");
                        target = load(IDENTITY); reference = reference.substring(reference.indexOf('#'));
                    }
                    Object current = target;
                    for (var segment : reference.substring(2).split("/")) current = map(current).get(segment.replace("~1", "/").replace("~0", "~"));
                    assertThat(current).as(reference).isNotNull();
                }
                assertReferences(entry.getValue(), root);
            }
        } else if (node instanceof Collection<?> values) {
            for (var value : values) assertReferences(value, root);
        }
    }
    @SuppressWarnings("unchecked") private Map<String, Object> map(Object value) {
        assertThat(value).isInstanceOf(Map.class); return (Map<String, Object>) value;
    }
    @SuppressWarnings("unchecked") private <T> Collection<T> list(Object value) {
        assertThat(value).isInstanceOf(Collection.class); return (Collection<T>) value;
    }
}
