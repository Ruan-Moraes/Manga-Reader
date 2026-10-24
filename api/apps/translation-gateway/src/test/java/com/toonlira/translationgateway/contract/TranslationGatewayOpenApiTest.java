package com.toonlira.translationgateway.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

class TranslationGatewayOpenApiTest {

    private static final Path CONTRACT_PATH = Path.of("openapi", "translation-gateway-v1.yaml");

    @Test
    void shouldExposeRecoveryAndKeepSubmissionPayloadMinimal() throws IOException {
        var contract = loadContract();
        var paths = map(contract.get("paths"));

        assertThat(paths).containsKeys(
            "/v1/capabilities",
            "/v1/anonymous/installations",
            "/v1/anonymous/sessions",
            "/v1/page-jobs",
            "/v1/page-jobs/by-idempotency/{idempotencyKey}",
            "/v1/page-jobs/{jobRef}",
            "/v1/page-jobs/{jobRef}/cancel",
            "/v1/page-jobs/{jobRef}/ack"
        );

        var pageSubmission = schema(contract, "PageSubmission");
        var properties = map(pageSubmission.get("properties"));
        assertThat(properties).containsKeys(
            "page",
            "mimeType",
            "byteSize",
            "widthPx",
            "heightPx",
            "sourceLanguage",
            "targetLanguage",
            "disclosureVersion",
            "attemptRef"
        );
        assertThat(properties).doesNotContainKeys("filename", "uri", "path", "projectId", "pageId", "accountId", "provider");

        var idempotencyHeader = parameter(contract, "IdempotencyKey");
        assertThat(idempotencyHeader).containsEntry("in", "header").containsEntry("required", true);
        assertThat(map(idempotencyHeader.get("schema"))).containsEntry("format", "uuid");
    }

    @Test
    void shouldResolveEveryInternalReference() throws IOException {
        var contract = loadContract();
        assertInternalReferencesResolve(contract, contract);
    }

    @Test
    void shouldPublishExactlyTheApprovedLanguagesAndRemoteStatuses() throws IOException {
        var contract = loadContract();

        assertThat(list(schema(contract, "TranslationLanguage").get("enum")))
            .containsExactly("ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR");
        assertThat(list(schema(contract, "RemoteJobStatus").get("enum")))
            .containsExactly("QUEUED", "OCR", "TRANSLATING", "RENDERING", "READY", "FAILED", "CANCEL_PENDING", "CANCELLED", "RESULT_EXPIRED");
    }

    @Test
    void shouldDistinguishRegionalOcrFromGlobalTranslation() throws IOException {
        var disclosure = schema(loadContract(), "LegalDisclosure");
        var properties = map(disclosure.get("properties"));
        assertThat(list(disclosure.get("required"))).contains("gatewayRegion", "ocrRegion", "translationLocation")
            .doesNotContain("processingRegions");
        assertThat(properties).doesNotContainKey("processingRegions");
        assertThat(map(properties.get("ocrRegion"))).containsEntry("const", "us");
        assertThat(map(properties.get("translationLocation"))).containsEntry("const", "global");
    }

    @Test
    void shouldAllowAnEmptyOperationalSetOnlyForADisabledGateway() throws IOException {
        var capabilities = schema(loadContract(), "Capabilities");
        var pairs = map(map(capabilities.get("properties")).get("supportedPairs"));
        assertThat(pairs).containsEntry("minItems", 0).containsEntry("maxItems", 42).containsEntry("uniqueItems", true);
        var conditional = map(list(capabilities.get("allOf")).iterator().next());
        assertThat(map(map(map(conditional.get("if")).get("properties")).get("enabled"))).containsEntry("const", true);
        assertThat(map(map(map(conditional.get("then")).get("properties")).get("supportedPairs"))).containsEntry("minItems", 1);
    }

    @Test
    void readyQueriesRequireCompletePrivateArtifactsWithoutChangingRoutesOrVersion() throws IOException {
        var contract = loadContract();
        assertThat(map(contract.get("paths"))).hasSize(8);
        var result = schema(contract, "ReadyResult");
        assertThat(list(result.get("required"))).containsExactly("manifestVersion", "widthPx", "heightPx", "expiresAt", "image", "manifest");
        assertThat(map(map(result.get("properties")).get("manifestVersion"))).containsEntry("const", "1.0");
        var download = schema(contract, "PrivateResultDownload");
        assertThat(list(download.get("required"))).containsExactly("url", "mimeType", "byteSize", "sha256", "expiresAt");
        assertThat(download).containsEntry("additionalProperties", false);
        assertThat(map(map(download.get("properties")).get("url"))).containsEntry("maxLength", 8192);
        var paths = map(contract.get("paths"));
        for (var path : new String[] {"/v1/page-jobs/{jobRef}", "/v1/page-jobs/by-idempotency/{idempotencyKey}"}) {
            var responses = map(map(map(paths.get(path)).get("get")).get("responses"));
            var json = map(map(map(responses.get("200")).get("content")).get("application/json"));
            assertThat(map(json.get("schema"))).containsEntry("$ref", "#/components/schemas/PageJobQueryEnvelope");
        }
        assertThat(list(schema(contract, "PageJobQueryEnvelope").get("allOf"))).hasSize(2);
    }

    @Test
    void jobQueriesDoNotCacheAvailabilityAfterAckOrTtl() throws IOException {
        var paths = map(loadContract().get("paths"));
        for (var path : new String[] {"/v1/page-jobs/{jobRef}", "/v1/page-jobs/by-idempotency/{idempotencyKey}"}) {
            var response = map(map(map(paths.get(path)).get("get")).get("responses"));
            var header = map(map(map(response.get("200")).get("headers")).get("Cache-Control"));
            assertThat(map(header.get("schema"))).containsEntry("const", "no-store");
        }
    }

    private Map<String, Object> loadContract() throws IOException {
        try (var reader = Files.newBufferedReader(CONTRACT_PATH)) {
            return map(new Yaml().load(reader));
        }
    }

    private Map<String, Object> schema(Map<String, Object> contract, String name) {
        return map(map(map(contract.get("components")).get("schemas")).get(name));
    }

    private Map<String, Object> parameter(Map<String, Object> contract, String name) {
        return map(map(map(contract.get("components")).get("parameters")).get(name));
    }

    private void assertInternalReferencesResolve(Object node, Map<String, Object> root) {
        if (node instanceof Map<?, ?> entries) {
            entries.forEach((key, value) -> {
                if ("$ref".equals(key) && value instanceof String reference && reference.startsWith("#/")) {
                    assertThat(resolveReference(root, reference)).as(reference).isNotNull();
                }
                assertInternalReferencesResolve(value, root);
            });
        } else if (node instanceof Collection<?> values) {
            values.forEach(value -> assertInternalReferencesResolve(value, root));
        }
    }

    private Object resolveReference(Map<String, Object> root, String reference) {
        Object current = root;
        for (var segment : reference.substring(2).split("/")) {
            if (!(current instanceof Map<?, ?> map)) return null;
            current = map.get(segment.replace("~1", "/").replace("~0", "~"));
        }
        return current;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object value) {
        assertThat(value).isInstanceOf(Map.class);
        return (Map<String, Object>) value;
    }

    @SuppressWarnings("unchecked")
    private <T> Collection<T> list(Object value) {
        assertThat(value).isInstanceOf(Collection.class);
        return (Collection<T>) value;
    }
}
