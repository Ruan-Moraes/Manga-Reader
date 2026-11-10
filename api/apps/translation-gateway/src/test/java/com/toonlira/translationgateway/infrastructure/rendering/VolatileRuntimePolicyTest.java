package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class VolatileRuntimePolicyTest {
    @Test void admitsOnlyDisabledContentPersistenceAndNoMultipartSpooling() {
        var properties = safe();
        assertThatCode(() -> VolatileRuntimePolicy.require(properties, false)).doesNotThrowAnyException();
        assertThatThrownBy(() -> VolatileRuntimePolicy.require(properties, true)).isInstanceOf(IllegalStateException.class);
    }
    @ParameterizedTest
    @ValueSource(strings = {"local", "gcs", "dispatch", "urls", "layout"})
    void rejectsLegacyOverridesEvenWhenTheVolatileProfileIsSelected(String override) {
        var properties = safe();
        switch (override) {
            case "local", "gcs" -> properties.getStorage().setMode(override);
            case "dispatch" -> properties.getDispatch().setMode("cloud-tasks");
            case "urls" -> properties.getResultDownload().setMode(GatewayProperties.ResultDownload.Mode.GCS);
            case "layout" -> properties.getLayout().setMode(GatewayProperties.Layout.Mode.SHADOW);
            default -> throw new IllegalArgumentException();
        }
        assertThatThrownBy(() -> VolatileRuntimePolicy.require(properties, false)).isInstanceOf(IllegalStateException.class);
    }
    @Test void requiresExplicitBoundedHttpRuntimeAndRejectsOverrides() {
        var environment = new org.springframework.mock.env.MockEnvironment();
        assertThatThrownBy(() -> VolatileRuntimePolicy.requireServerBudget(environment)).isInstanceOf(IllegalStateException.class);
        environment.withProperty("server.tomcat.threads.max", "8").withProperty("server.tomcat.threads.min-spare", "2")
            .withProperty("server.tomcat.max-connections", "32").withProperty("server.tomcat.accept-count", "16");
        assertThatCode(() -> VolatileRuntimePolicy.requireServerBudget(environment)).doesNotThrowAnyException();
        for (var key : java.util.List.of("server.tomcat.threads.max", "server.tomcat.threads.min-spare",
            "server.tomcat.max-connections", "server.tomcat.accept-count")) {
            String previous = environment.getProperty(key);
            environment.withProperty(key, "100");
            assertThatThrownBy(() -> VolatileRuntimePolicy.requireServerBudget(environment)).isInstanceOf(IllegalStateException.class);
            environment.withProperty(key, previous);
        }
        environment.withProperty("spring.threads.virtual.enabled", "true");
        assertThatThrownBy(() -> VolatileRuntimePolicy.requireServerBudget(environment)).isInstanceOf(IllegalStateException.class);
    }
    private static GatewayProperties safe() {
        var properties = new GatewayProperties();
        properties.getStorage().setMode("disabled");
        return properties;
    }
}
