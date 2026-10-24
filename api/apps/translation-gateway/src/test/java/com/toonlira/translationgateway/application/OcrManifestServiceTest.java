package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OcrManifestServiceTest {
    private final OcrManifestService service = new OcrManifestService(GatewayJsonMapper.create());

    @Test
    void shouldEncodeAnEmptyPageWithAStableHash() {
        var manifest = new OcrManifest("1.0", UUID.randomUUID(), "ja", 100, 200, List.of());
        var encoded = service.encode(manifest);
        assertThat(encoded.sha256()).matches("[0-9a-f]{64}");
        assertThat(new String(encoded.bytes(), java.nio.charset.StandardCharsets.UTF_8)).contains("\"regions\":[]");
    }

    @Test
    void shouldRejectDuplicateOrderAndDegeneratePolygon() {
        var id = UUID.randomUUID();
        var polygon = List.of(new OcrManifest.Vertex(0.1, 0.1), new OcrManifest.Vertex(0.5, 0.1),
            new OcrManifest.Vertex(0.5, 0.5), new OcrManifest.Vertex(0.1, 0.5));
        var region = new OcrManifest.Region(id, 0, "texto", polygon);
        var duplicate = new OcrManifest("1.0", UUID.randomUUID(), "ja", 100, 200, List.of(region, region));
        assertThatThrownBy(() -> service.encode(duplicate)).isInstanceOf(GatewayException.class);

        var line = new OcrManifest.Region(id, 0, "texto", List.of(
            new OcrManifest.Vertex(0, 0), new OcrManifest.Vertex(0.1, 0.1),
            new OcrManifest.Vertex(0.2, 0.2), new OcrManifest.Vertex(0.3, 0.3)));
        assertThatThrownBy(() -> service.encode(new OcrManifest("1.0", UUID.randomUUID(), "ja", 100, 200, List.of(line))))
            .isInstanceOf(GatewayException.class);
    }
}
