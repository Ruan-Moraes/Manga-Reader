package com.toonlira.translationgateway.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class SwaggerUiStartupLoggerTest {
    @Test
    void buildsUrlFromPortAndSwaggerPath() {
        var environment = new MockEnvironment()
                .withProperty("local.server.port", "8084")
                .withProperty("springdoc.swagger-ui.path", "/swagger-ui.html");

        assertThat(new SwaggerUiStartupLogger(environment).swaggerUrl())
                .isEqualTo("http://localhost:8084/swagger-ui.html");
    }

    @Test
    void fallsBackToConfiguredPortAndIncludesContextPath() {
        var environment = new MockEnvironment()
                .withProperty("server.port", "9000")
                .withProperty("server.servlet.context-path", "/gw");

        assertThat(new SwaggerUiStartupLogger(environment).swaggerUrl())
                .isEqualTo("http://localhost:9000/gw/swagger-ui.html");
    }
}
