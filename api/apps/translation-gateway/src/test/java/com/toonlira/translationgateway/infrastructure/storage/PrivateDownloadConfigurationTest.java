package com.toonlira.translationgateway.infrastructure.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.google.auth.oauth2.GoogleCredentials;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Clock;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

class PrivateDownloadConfigurationTest {
    private final PrivateDownloadClientFactory factory = mock(PrivateDownloadClientFactory.class);
    private final ApplicationContextRunner context = new ApplicationContextRunner()
        .withUserConfiguration(PropertiesConfiguration.class, PrivateDownloadConfiguration.class)
        .withBean(Clock.class, Clock::systemUTC)
        .withBean(PrivateDownloadClientFactory.class, () -> factory);

    @Test
    void defaultDoesNotInitializeCredentialsOrGoogleClientAndCannotInventUrl() {
        try (var adc = mockStatic(GoogleCredentials.class)) {
            context.run(application -> {
                assertThat(application).hasNotFailed().hasSingleBean(PrivateDownloadPort.class);
                assertThatThrownBy(() -> application.getBean(PrivateDownloadPort.class).sign(null))
                    .isInstanceOf(GatewayException.class).hasMessage("storage-unavailable").hasNoCause();
                verifyNoInteractions(factory);
                adc.verifyNoInteractions();
            });
        }
    }

    @Test
    void workerDoesNotInitializeDownloadClientEvenWithGcsOptIn() {
        context.withPropertyValues("spring.profiles.active=worker", "gateway.result-download.mode=gcs")
            .run(application -> {
                assertThat(application).hasNotFailed().doesNotHaveBean(PrivateDownloadPort.class);
                verifyNoInteractions(factory);
            });
    }

    @ParameterizedTest
    @ValueSource(strings = {"project", "bucket", "account", "storage"})
    void invalidPreparationFailsBeforeCredentials(String defect) {
        context.withPropertyValues("gateway.result-download.mode=gcs",
            "gateway.result-download.project-id=" + (defect.equals("project") ? "bad" : "synthetic-project"),
            "gateway.result-download.signer-service-account=" + (defect.equals("account") ? "https://evil.test" : "signer@synthetic-project.iam.gserviceaccount.com"),
            "gateway.storage.mode=" + (defect.equals("storage") ? "local" : "gcs"),
            "gateway.storage.bucket=" + (defect.equals("bucket") ? "bad/bucket" : "private-test-bucket"))
            .run(application -> {
                assertThat(application).hasFailed();
                assertThat(application.getStartupFailure().getCause().getCause())
                    .hasMessage("Private download preparation unavailable").hasNoCause();
                verifyNoInteractions(factory);
            });
    }

    @Test
    void validExplicitOptInUsesInjectedFactoryWithoutFallback() {
        var port = mock(PrivateDownloadPort.class);
        when(factory.create(any(), any())).thenReturn(port);
        context.withPropertyValues("gateway.result-download.mode=gcs", "gateway.result-download.project-id=synthetic-project",
            "gateway.result-download.signer-service-account=signer@synthetic-project.iam.gserviceaccount.com",
            "gateway.storage.mode=gcs", "gateway.storage.bucket=private-test-bucket")
            .run(application -> assertThat(application).hasNotFailed().getBean(PrivateDownloadPort.class).isSameAs(port));
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(GatewayProperties.class)
    static class PropertiesConfiguration { }
}
