package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.config.GatewayProperties;

/** Reject persistence/spooling overrides before admitting the volatile runtime. */
final class VolatileRuntimePolicy {
    private VolatileRuntimePolicy() { }
    static void requireServerBudget(org.springframework.core.env.Environment environment) {
        int maximum = environment.getProperty("server.tomcat.threads.max", Integer.class, 200);
        int spare = environment.getProperty("server.tomcat.threads.min-spare", Integer.class, 10);
        int connections = environment.getProperty("server.tomcat.max-connections", Integer.class, 8192);
        int backlog = environment.getProperty("server.tomcat.accept-count", Integer.class, 100);
        if (maximum < 1 || maximum > 8 || spare < 0 || spare > 2 || spare > maximum
            || connections < 1 || connections > 32 || backlog < 1 || backlog > 16
            || environment.getProperty("spring.threads.virtual.enabled", Boolean.class, false))
            throw new IllegalStateException("Volatile HTTP runtime exceeds its admitted thread and connection budget");
    }
    static void require(GatewayProperties properties, boolean multipartEnabled) {
        if (multipartEnabled || !"disabled".equals(properties.getStorage().getMode())
            || !"disabled".equals(properties.getDispatch().getMode())
            || properties.getResultDownload().getMode() != GatewayProperties.ResultDownload.Mode.DISABLED
            || properties.getLayout().getMode() != GatewayProperties.Layout.Mode.DISABLED)
            throw new IllegalStateException("Volatile runtime requires content persistence and multipart spooling disabled");
    }
}
