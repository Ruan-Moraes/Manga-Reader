package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class GetCapabilitiesUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");

    @Test
    void shouldPreserveTheCapabilitiesContractWhenLanguagesAreCentralized() {
        var languages = List.of("ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR");
        var result = new GetCapabilitiesUseCase(validProperties(), Clock.fixed(NOW, ZoneOffset.UTC)).execute();
        assertThat(GetCapabilitiesUseCase.LANGUAGES).containsExactlyElementsOf(languages);
        assertThat(result.supportedLanguages()).containsExactlyElementsOf(languages);
        var expectedPairs = languages.stream().flatMap(source -> languages.stream()
            .filter(target -> !source.equals(target))
            .map(target -> new CapabilitiesView.LanguagePair(source, target))).toList();
        assertThat(result.supportedPairs()).containsExactlyElementsOf(expectedPairs);
        assertThat(result.contractVersion()).isEqualTo("1.0");
        assertThat(result.disclosure().gatewayRegion()).isEqualTo("southamerica-east1");
        assertThat(result.disclosure().ocrRegion()).isEqualTo("us");
        assertThat(result.disclosure().translationLocation()).isEqualTo("global");
        assertThat(result.generatedAt()).isEqualTo(NOW);
        assertThat(result.validUntil()).isEqualTo(NOW.plusSeconds(300));
        var json = GatewayJsonMapper.create().valueToTree(result);
        var fields = new ArrayList<String>();
        json.propertyNames().forEach(fields::add);
        assertThat(fields).containsExactly("contractVersion", "gatewayKey", "generatedAt", "validUntil",
            "enabled", "supportedLanguages", "supportedPairs", "mediaLimits", "dailyInstallationQuota",
            "dailyGlobalQuota", "disclosure");
        assertThat(json.get("supportedPairs").get(0).toString()).isEqualTo("{\"source\":\"ja\",\"target\":\"en\"}");
        assertThat(json.get("disclosure").has("processingRegions")).isFalse();
        assertThat(json.has("etag")).isFalse();
    }

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
    void shouldPublishOnlyConfiguredPairsInCanonicalOrder() {
        var properties = validProperties();
        properties.getTranslation().setEnabledPairs(List.of("zh-Hant:zh-Hans", "ja:pt-BR"));
        var result = new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC)).execute();
        assertThat(result.supportedPairs()).containsExactly(
            new CapabilitiesView.LanguagePair("ja", "pt-BR"), new CapabilitiesView.LanguagePair("zh-Hant", "zh-Hans"));
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR", "zh-Hant:zh-Hans"));
        assertThat(new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC)).execute().etag()).isEqualTo(result.etag());
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR"));
        assertThat(new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC)).execute().etag()).isNotEqualTo(result.etag());
    }

    @Test
    void shouldPublishNoPairsWhenTranslationIsDisabledOrTheConfiguredSetIsEmpty() {
        var properties = validProperties();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.DISABLED);
        assertThat(new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC)).execute().supportedPairs()).isEmpty();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setEnabledPairs(List.of());
        assertThat(new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC)).execute().supportedPairs()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"ja:ja", "ja:unknown", "zh:pt-BR", "ja:pt-BR:en", " ja:en", ""})
    void shouldRejectMalformedPairConfiguration(String pair) {
        var properties = validProperties();
        properties.getTranslation().setEnabledPairs(List.of(pair));
        assertThatThrownBy(() -> new GetCapabilitiesUseCase(properties, Clock.systemUTC()).execute())
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.CAPABILITIES_UNAVAILABLE));
    }

    @Test
    void shouldRejectDuplicatePairsAndAnEnabledGatewayWithoutOperationalPairs() {
        var properties = validProperties();
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR", "ja:pt-BR"));
        assertThatThrownBy(() -> new GetCapabilitiesUseCase(properties, Clock.systemUTC()).execute()).isInstanceOf(GatewayException.class);
        properties.getTranslation().setEnabledPairs(List.of());
        properties.setEnabled(true);
        properties.getDispatch().setMode("local-ack");
        assertThatThrownBy(() -> new GetCapabilitiesUseCase(properties, Clock.systemUTC()).execute())
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.CAPABILITIES_UNAVAILABLE));
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
    void shouldRejectTheSupersededDisclosureVersionBeforeAcceptingMedia() {
        var properties = validProperties();
        properties.getDisclosure().setVersion("2026-09-07.v1");
        properties.setEnabled(true);
        properties.getDispatch().setMode("local-ack");

        assertThatThrownBy(() -> new GetCapabilitiesUseCase(properties, Clock.fixed(NOW, ZoneOffset.UTC)).requireEnabled())
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
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setEnabledPairs(LanguagePair.all().stream()
            .map(pair -> pair.source() + ":" + pair.target()).toList());
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
