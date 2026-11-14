package com.toonlira.translationgateway.infrastructure.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** Imprime no console, ao subir, a URL do Swagger UI do gateway. */
@Component
public class SwaggerUiStartupLogger {
    private static final Logger LOGGER = LoggerFactory.getLogger(SwaggerUiStartupLogger.class);

    private final Environment environment;

    SwaggerUiStartupLogger(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    void logSwaggerUrl() {
        if (!environment.getProperty("springdoc.swagger-ui.enabled", Boolean.class, true)) {
            return;
        }
        LOGGER.info("Swagger UI disponível em: {}", swaggerUrl());
    }

    String swaggerUrl() {
        var port = environment.getProperty("local.server.port", environment.getProperty("server.port", "8080"));
        var contextPath = environment.getProperty("server.servlet.context-path", "");
        var swaggerPath = environment.getProperty("springdoc.swagger-ui.path", "/swagger-ui.html");
        return "http://localhost:" + port + contextPath + swaggerPath;
    }
}
