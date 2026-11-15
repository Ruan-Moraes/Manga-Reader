package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.TranslationRefinerPort;
import java.time.Duration;
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

    @Test
    void refineIsOffByDefaultAndOutsideTheWorker() {
        var factory = mock(GeminiClientFactory.class);
        var worker = new MockEnvironment();
        worker.setActiveProfiles("worker");
        var defaults = refineProperties();
        defaults.getTranslation().getRefine().setMode(GatewayProperties.Translation.Refine.Mode.DISABLED);
        assertThat(new TranslationConfiguration().translationRefiner(defaults, worker, factory)).isSameAs(TranslationRefinerPort.NONE);
        assertThat(new TranslationConfiguration().translationRefiner(refineProperties(), new MockEnvironment(), factory))
            .isSameAs(TranslationRefinerPort.NONE);
        var translationOff = refineProperties();
        translationOff.getTranslation().setMode(GatewayProperties.Translation.Mode.DISABLED);
        assertThat(new TranslationConfiguration().translationRefiner(translationOff, worker, factory)).isSameAs(TranslationRefinerPort.NONE);
        verify(factory, never()).create(any(), any(), any(), any());
        assertThat(new GatewayProperties().getTranslation().getRefine().getMode())
            .isEqualTo(GatewayProperties.Translation.Refine.Mode.DISABLED);
    }

    @Test
    void geminiModeBuildsTheVertexClientWithTheConfiguredModelAndLocation() {
        var factory = mock(GeminiClientFactory.class);
        when(factory.create(any(), any(), any(), any())).thenReturn((system, user) -> "{}");
        var worker = new MockEnvironment();
        worker.setActiveProfiles("worker");

        var refiner = new TranslationConfiguration().translationRefiner(refineProperties(), worker, factory);

        assertThat(refiner).isInstanceOf(GeminiTranslationRefiner.class);
        verify(factory).create("test-project", "us", "gemini-2.5-flash", Duration.ofSeconds(20));
    }

    @Test
    void invalidRefineConfigurationFailsStartupBeforeClientCreation() {
        var factory = mock(GeminiClientFactory.class);
        var worker = new MockEnvironment();
        worker.setActiveProfiles("worker");
        var badModel = refineProperties();
        badModel.getTranslation().getRefine().setModel("../other");
        var badTimeout = refineProperties();
        badTimeout.getTranslation().getRefine().setTimeout(Duration.ofMinutes(5));
        var badBudget = refineProperties();
        badBudget.getTranslation().getRefine().setMaxChars(0);
        var badLocation = refineProperties();
        badLocation.getTranslation().getRefine().setLocation("");
        for (var properties : List.of(badModel, badTimeout, badBudget, badLocation)) {
            assertThatThrownBy(() -> new TranslationConfiguration().translationRefiner(properties, worker, factory))
                .isInstanceOf(IllegalStateException.class).hasMessage("Translation refine configuration is invalid");
        }
        verify(factory, never()).create(any(), any(), any(), any());
    }

    private static GatewayProperties refineProperties() {
        var properties = new GatewayProperties();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setProjectId("test-project");
        properties.getTranslation().getRefine().setMode(GatewayProperties.Translation.Refine.Mode.GEMINI);
        return properties;
    }
}
