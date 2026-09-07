package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class GetCapabilitiesUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");

    @Test
    void shouldPublishAllFortyTwoPairsAndRemainDisabled() {
        var properties = validProperties();
        var result = new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC)).execute();

        assertThat(result.supportedLanguages()).hasSize(7);
        assertThat(result.supportedPairs()).hasSize(42).allMatch(pair -> !pair.source().equals(pair.target()));
        assertThat(result.enabled()).isFalse();
        assertThat(result.validUntil()).isAfter(result.generatedAt());
        assertThat(result.etag()).startsWith("W/\"").endsWith("\"");
    }

    @Test
    void shouldFailClosedWhenLegalConfigurationIsMissing() {
        var properties = validProperties();
        properties.getDisclosure().setPrivacyPolicyUrl("");

        assertThatThrownBy(() -> new GetCapabilitiesUseCase(properties, Clock.systemUTC()).execute())
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.CAPABILITIES_UNAVAILABLE));
    }

    @Test
    void shouldChangeEtagWhenAnyPublishedConfigurationChanges() {
        var first = validProperties();
        var second = validProperties();
        second.getDisclosure().setTermsUrl("https://example.com/updated-terms");

        var firstEtag = new GetCapabilitiesUseCase(first, Clock.fixed(NOW, ZoneOffset.UTC)).execute().etag();
        var secondEtag = new GetCapabilitiesUseCase(second, Clock.fixed(NOW, ZoneOffset.UTC)).execute().etag();

        assertThat(secondEtag).isNotEqualTo(firstEtag);
    }

    @Test
    void shouldRequireAUsableDispatchConfigurationBeforeAcceptingMedia() {
        var properties = validProperties();
        properties.setEnabled(true);
        var useCase = new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC));

        assertThatThrownBy(useCase::requireEnabled)
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.CAPABILITIES_UNAVAILABLE));

        properties.getDispatch().setMode("local-ack");
        assertThatCode(useCase::requireEnabled).doesNotThrowAnyException();
    }

    static GatewayProperties validProperties() {
        var properties = new GatewayProperties();
        properties.setKey("toonlira-alpha");
        var disclosure = properties.getDisclosure();
        disclosure.setVersion("privacy-2026-09");
        disclosure.setOperatorName("Toonlira");
        disclosure.setOperatorContact("privacy@example.com");
        disclosure.setPrivacyPolicyUrl("https://example.com/privacy");
        disclosure.setTermsUrl("https://example.com/terms");
        disclosure.setProviderTrainingPolicy("Provider data is not used for model training.");
        return properties;
    }
}
