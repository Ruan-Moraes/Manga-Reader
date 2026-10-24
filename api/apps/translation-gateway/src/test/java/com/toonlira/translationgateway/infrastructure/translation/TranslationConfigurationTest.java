package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class TranslationConfigurationTest {
    @Test
    void duplicatePairsFailBeforeCredentialsOrNetworkClientCreation() throws Exception {
        var properties = new GatewayProperties();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setProjectId("test-project");
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR", "ja:pt-BR"));
        properties.getStorage().setMode("gcs");
        properties.getStorage().setBucket("test-bucket");
        var factory = mock(TranslationClientFactory.class);
        var environment = new MockEnvironment();
        environment.setActiveProfiles("worker");
        assertThatThrownBy(() -> new TranslationConfiguration().translationPort(properties, environment, factory))
            .isInstanceOf(IllegalStateException.class).hasMessage("Translation enabled pairs are invalid");
        verify(factory, never()).create();
    }

    @Test
    void disabledWorkerDoesNotInitializeCredentialsOrNetworkClient() throws Exception {
        var properties = new GatewayProperties();
        var factory = mock(TranslationClientFactory.class);
        var environment = new MockEnvironment().withProperty("spring.profiles.active", "worker");
        environment.setActiveProfiles("worker");

        var port = new TranslationConfiguration().translationPort(properties, environment, factory);

        assertThatThrownBy(() -> port.translate(new TranslationRequest(UUID.randomUUID(),
            new LanguagePair("en", "pt-BR"), List.of()))).isInstanceOf(IllegalStateException.class);
        verify(factory, never()).create();
    }

    @Test
    void enabledModeRejectsNonGcsConfigurationBeforeClientCreation() throws Exception {
        var properties = new GatewayProperties();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setProjectId("test-project");
        var factory = mock(TranslationClientFactory.class);
        var environment = new MockEnvironment();
        environment.setActiveProfiles("worker");

        assertThatThrownBy(() -> new TranslationConfiguration().translationPort(properties, environment, factory))
            .isInstanceOf(IllegalStateException.class);
        verify(factory, never()).create();
    }
}
