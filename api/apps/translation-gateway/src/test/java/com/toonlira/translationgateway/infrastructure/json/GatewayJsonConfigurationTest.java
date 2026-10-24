package com.toonlira.translationgateway.infrastructure.json;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.presentation.GatewayProblem;
import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

class GatewayJsonConfigurationTest {
    @Test void exposesOneJackson3JsonMapperWithIsoInstants() {
        new ApplicationContextRunner().withUserConfiguration(GatewayJsonConfiguration.class).run(context -> {
            assertThat(context).hasSingleBean(JsonMapper.class).hasSingleBean(ObjectMapper.class);
            var mapper = context.getBean(JsonMapper.class);
            assertThat(mapper.writeValueAsString(Map.of("time", Instant.parse("2026-10-10T12:00:00Z"))))
                .isEqualTo("{\"time\":\"2026-10-10T12:00:00Z\"}");
        });
    }

    @Test void preservesProblemShapeFieldOrderAndUriWithoutEscapingSlashes() {
        var problem = new GatewayProblem(URI.create("https://translation-api.toonlira.app/problems/unauthorized"),
            "unauthorized", 401, "unauthorized", "1.0",
            UUID.fromString("00000000-0000-0000-0000-000000000001"), false);
        assertThat(GatewayJsonMapper.create().writeValueAsString(problem)).isEqualTo(
            "{\"type\":\"https://translation-api.toonlira.app/problems/unauthorized\",\"title\":\"unauthorized\","
                + "\"status\":401,\"code\":\"unauthorized\",\"contractVersion\":\"1.0\","
                + "\"correlationRef\":\"00000000-0000-0000-0000-000000000001\",\"retryable\":false}");
    }

    @Test void rejectsUnknownRequestFieldsByDefault() {
        assertThatThrownBy(() -> GatewayJsonMapper.create().readValue("{\"value\":1,\"extra\":2}", Request.class))
            .isInstanceOf(JacksonException.class);
    }

    private record Request(int value) { }
}
