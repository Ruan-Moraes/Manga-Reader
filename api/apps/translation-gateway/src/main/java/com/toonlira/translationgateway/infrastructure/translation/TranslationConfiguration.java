package com.toonlira.translationgateway.infrastructure.translation;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.config.ConfiguredTranslationPairs;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import java.io.IOException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@Configuration(proxyBeanMethods = false)
public class TranslationConfiguration {
    @Bean
    @ConditionalOnMissingBean(TranslationClientFactory.class)
    TranslationClientFactory translationClientFactory() { return new TranslationClientFactory(); }

    @Bean
    TranslationPort translationPort(GatewayProperties properties, Environment environment,
                                    TranslationClientFactory factory) {
        if (!environment.acceptsProfiles(Profiles.of("worker"))
            || properties.getTranslation().getMode() == GatewayProperties.Translation.Mode.DISABLED) {
            return request -> { throw new IllegalStateException("Translation disabled"); };
        }
        if (!"gcs".equals(properties.getStorage().getMode())
            || !properties.getTranslation().getProjectId().matches("[a-z][a-z0-9-]{4,28}[a-z0-9]")
            || !properties.getStorage().getBucket().matches("[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]")) {
            throw new IllegalStateException("Translation requires a valid project and private GCS storage configuration");
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
}
