package com.toonlira.translationgateway.infrastructure.storage;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Clock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("!worker")
public class PrivateDownloadConfiguration {
    @Bean
    @ConditionalOnMissingBean(PrivateDownloadClientFactory.class)
    PrivateDownloadClientFactory privateDownloadClientFactory() { return new PrivateDownloadClientFactory(); }

    @Bean
    @ConditionalOnMissingBean(PrivateDownloadPort.class)
    PrivateDownloadPort privateDownloadPort(GatewayProperties properties, Clock clock, PrivateDownloadClientFactory factory) {
        var configuration = properties.getResultDownload();
        if (configuration.getMode() == GatewayProperties.ResultDownload.Mode.DISABLED) {
            return request -> { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); };
        }
        var project = configuration.getProjectId();
        var account = configuration.getSignerServiceAccount();
        if (configuration.getMode() != GatewayProperties.ResultDownload.Mode.GCS
            || project == null || !project.matches("[a-z][a-z0-9-]{4,28}[a-z0-9]")
            || account == null || !account.matches("[a-z][a-z0-9-]{4,28}[a-z0-9]@" + project + "\\.iam\\.gserviceaccount\\.com")
            || !"gcs".equals(properties.getStorage().getMode())
            || !GoogleCloudPrivateDownloadAdapter.validBucket(properties.getStorage().getBucket())) {
            throw new IllegalStateException("Private download preparation unavailable");
        }
        try { return factory.create(properties, clock); }
        catch (RuntimeException error) { throw new IllegalStateException("Private download preparation unavailable"); }
    }
}
