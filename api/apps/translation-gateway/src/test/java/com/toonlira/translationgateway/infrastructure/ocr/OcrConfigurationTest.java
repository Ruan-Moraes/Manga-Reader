package com.toonlira.translationgateway.infrastructure.ocr;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.OcrPort;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

class OcrConfigurationTest {
    private final VisionClientFactory factory = mock(VisionClientFactory.class);
    private final ApplicationContextRunner context = new ApplicationContextRunner()
        .withUserConfiguration(Binding.class, OcrConfiguration.class)
        .withBean(VisionClientFactory.class, () -> factory);

    @Test
    void disabledModeDoesNotCreateClientOrAcquireCredentials() {
        context.withPropertyValues("spring.profiles.active=worker").run(application -> {
            assertThat(application).hasNotFailed();
            assertThat(application.getBean(OcrPort.class).available()).isFalse();
            verifyNoInteractions(factory);
        });
    }

    @Test
    void visionModeOutsideWorkerCannotCreateClient() {
        context.withPropertyValues("gateway.ocr.mode=vision").run(application -> {
            assertThat(application.getBean(OcrPort.class).available()).isFalse();
            verifyNoInteractions(factory);
        });
    }

    @Test
    void invalidStorageOrProjectFailsBeforeClientConstruction() {
        context.withPropertyValues("spring.profiles.active=worker", "gateway.ocr.mode=vision").run(application -> {
            assertThat(application).hasFailed();
            verifyNoInteractions(factory);
        });
        context.withPropertyValues("spring.profiles.active=worker", "gateway.ocr.mode=vision",
            "gateway.ocr.project-id=test-project", "gateway.storage.mode=local", "gateway.storage.bucket=private-fixtures")
            .run(application -> {
                assertThat(application).hasFailed();
                verifyNoInteractions(factory);
            });
    }

    @Test
    void invalidModeCannotSilentlyEnableVision() {
        context.withPropertyValues("spring.profiles.active=worker", "gateway.ocr.mode=typo").run(application -> {
            assertThat(application).hasFailed();
            verifyNoInteractions(factory);
        });
        context.withPropertyValues("spring.profiles.active=worker", "gateway.ocr.mode=",
            "gateway.ocr.project-id=test-project", "gateway.storage.mode=gcs", "gateway.storage.bucket=private-fixtures")
            .run(application -> {
                assertThat(application.getBean(OcrPort.class).available()).isFalse();
                verifyNoInteractions(factory);
            });
    }

    @Test
    void validWorkerConfigurationCreatesAndClosesOneClient() throws Exception {
        var client = mock(ImageAnnotatorClient.class);
        when(factory.create()).thenReturn(client);
        context.withPropertyValues("spring.profiles.active=worker", "gateway.ocr.mode=vision",
            "gateway.ocr.project-id=test-project", "gateway.storage.mode=gcs", "gateway.storage.bucket=private-fixtures")
            .run(application -> {
                assertThat(application).hasNotFailed();
                assertThat(application.getBean(OcrPort.class)).isInstanceOf(VisionOcrAdapter.class);
            });
        verify(factory).create();
        verify(client).close();
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(GatewayProperties.class)
    static class Binding { }
}
