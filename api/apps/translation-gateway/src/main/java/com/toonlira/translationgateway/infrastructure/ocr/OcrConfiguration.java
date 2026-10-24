package com.toonlira.translationgateway.infrastructure.ocr;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.OcrPort;
import java.io.IOException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@Configuration(proxyBeanMethods = false)
public class OcrConfiguration {
    @Bean
    @ConditionalOnMissingBean(VisionClientFactory.class)
    VisionClientFactory visionClientFactory() { return new VisionClientFactory(); }

    @Bean
    OcrPort ocrPort(GatewayProperties properties, Environment environment, VisionClientFactory factory) throws IOException {
        if (!environment.acceptsProfiles(Profiles.of("worker"))
            || properties.getOcr().getMode() != GatewayProperties.Ocr.Mode.VISION) return new DisabledOcrAdapter();
        var project = properties.getOcr().getProjectId();
        var bucket = properties.getStorage().getBucket();
        if (!project.matches("[a-z][a-z0-9-]{4,28}[a-z0-9]") || !"gcs".equals(properties.getStorage().getMode())
            || !bucket.matches("[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]")) {
            throw new IllegalStateException("Vision requires a valid project and private GCS storage configuration");
        }
        try {
            return new VisionOcrAdapter(factory.create(), project, bucket);
        } catch (IOException | RuntimeException error) {
            throw new IllegalStateException("Vision client initialization unavailable");
        }
    }
}
