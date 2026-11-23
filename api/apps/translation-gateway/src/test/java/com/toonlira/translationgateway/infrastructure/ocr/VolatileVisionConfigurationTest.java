package com.toonlira.translationgateway.infrastructure.ocr;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.OcrPort;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

class VolatileVisionConfigurationTest {
    @Test void productionConfigurationCannotConstructALegacyUriClientEvenUnderWorkerOverrides() {
        var factory = mock(VisionClientFactory.class);
        new ApplicationContextRunner().withUserConfiguration(Binding.class, OcrConfiguration.class)
            .withBean(VisionClientFactory.class, () -> factory)
            .withPropertyValues("spring.profiles.active=worker", "gateway.ocr.mode=vision", "gateway.ocr.project-id=test-project",
                "gateway.storage.mode=gcs", "gateway.storage.bucket=private-fixtures")
            .run(context -> {
                assertThat(context).hasNotFailed();
                assertThat(context.getBeansOfType(OcrPort.class)).isEmpty();
                verifyNoInteractions(factory);
            });
    }
    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(GatewayProperties.class)
    static class Binding { }
}
