package com.toonlira.translationgateway.infrastructure.translation;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.port.TranslationRefinerPort;
import com.toonlira.translationgateway.application.config.ConfiguredTranslationPairs;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import java.io.IOException;
import java.time.Duration;
import java.util.regex.Pattern;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@Configuration(proxyBeanMethods = false)
public class TranslationConfiguration {
    static final Pattern REFINE_MODEL = Pattern.compile("[a-z0-9][a-z0-9.-]{1,62}[a-z0-9]");
    static final Pattern REFINE_LOCATION = Pattern.compile("[a-z][a-z0-9-]{0,28}[a-z0-9]");
    static final Duration MAX_REFINE_TIMEOUT = Duration.ofSeconds(60);
    static final int MAX_REFINE_CHARS = 60_000;

    @Bean
    @ConditionalOnMissingBean(TranslationClientFactory.class)
    TranslationClientFactory translationClientFactory() { return new TranslationClientFactory(); }

    @Bean
    TranslationPort translationPort(GatewayProperties properties, Environment environment,
                                    TranslationClientFactory factory) {
        if ((!environment.acceptsProfiles(Profiles.of("worker")) && !properties.isVolatileProcessingEnabled())
            || properties.getTranslation().getMode() == GatewayProperties.Translation.Mode.DISABLED) {
            return request -> { throw new IllegalStateException("Translation disabled"); };
        }
        if (!properties.getTranslation().getProjectId().matches("[1-9][0-9]{0,19}")
            || !properties.isVolatileProcessingEnabled() && (!"gcs".equals(properties.getStorage().getMode())
                || !properties.getStorage().getBucket().matches("[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]"))) {
            throw new IllegalStateException("Translation requires a valid project configuration");
        }
        try {
            if (ConfiguredTranslationPairs.parse(properties.getTranslation().getEnabledPairs()).isEmpty()) {
                throw new IllegalStateException();
            }
        } catch (TranslationValidationException | IllegalStateException error) {
            throw new IllegalStateException("Translation enabled pairs are invalid");
        }
        try {
            return new CloudTranslationAdapter(factory.create(), properties.getTranslation().getProjectId());
        } catch (IOException | RuntimeException error) {
            throw new IllegalStateException("Translation client initialization unavailable");
        }
    }

    @Bean
    @ConditionalOnMissingBean(GeminiClientFactory.class)
    GeminiClientFactory geminiClientFactory() { return new GeminiClientFactory(); }

    /** Off unless the worker translates AND refine.mode is gemini; a bad configuration fails startup, never a page. */
    @Bean
    TranslationRefinerPort translationRefiner(GatewayProperties properties, Environment environment, GeminiClientFactory factory) {
        var translation = properties.getTranslation();
        var refine = translation.getRefine();
        if (!environment.acceptsProfiles(Profiles.of("worker"))
            || translation.getMode() == GatewayProperties.Translation.Mode.DISABLED
            || refine.getMode() == GatewayProperties.Translation.Refine.Mode.DISABLED) {
            return TranslationRefinerPort.NONE;
        }
        if (!validRefineConfiguration(properties)) throw new IllegalStateException("Translation refine configuration is invalid");
        try {
            return new GeminiTranslationRefiner(factory.create(translation.getProjectId(), refine.getLocation(),
                refine.getModel(), refine.getTimeout()), refine.getMaxChars());
        } catch (RuntimeException error) {
            throw new IllegalStateException("Translation refine client initialization unavailable");
        }
    }

    static boolean validRefineConfiguration(GatewayProperties properties) {
        var refine = properties.getTranslation().getRefine();
        var timeout = refine.getTimeout();
        return properties.getTranslation().getProjectId().matches("[a-z][a-z0-9-]{4,28}[a-z0-9]")
            && REFINE_MODEL.matcher(refine.getModel()).matches()
            && REFINE_LOCATION.matcher(refine.getLocation()).matches()
            && timeout != null && !timeout.isNegative() && !timeout.isZero() && timeout.compareTo(MAX_REFINE_TIMEOUT) <= 0
            && refine.getMaxChars() > 0 && refine.getMaxChars() <= MAX_REFINE_CHARS;
    }
}
