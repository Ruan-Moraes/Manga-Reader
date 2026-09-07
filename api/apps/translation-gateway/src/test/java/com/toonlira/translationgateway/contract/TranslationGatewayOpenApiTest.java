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
