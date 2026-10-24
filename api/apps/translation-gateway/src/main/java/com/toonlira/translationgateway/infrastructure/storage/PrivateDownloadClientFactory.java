package com.toonlira.translationgateway.infrastructure.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ImpersonatedCredentials;
import com.google.cloud.storage.StorageOptions;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import java.io.IOException;
import java.time.Clock;
import java.util.List;

/** Only an explicit validated opt-in may call this boundary; no private key is created. */
public class PrivateDownloadClientFactory {
    private static final String CLOUD_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    public PrivateDownloadPort create(GatewayProperties properties, Clock clock) {
        try {
            var configuration = properties.getResultDownload();
            var source = GoogleCredentials.getApplicationDefault().createScoped(List.of(CLOUD_SCOPE));
            var credentials = ImpersonatedCredentials.create(source, configuration.getSignerServiceAccount(),
                List.of(), List.of(CLOUD_SCOPE), GoogleCloudPrivateDownloadAdapter.MAX_URL_SECONDS);
            var storage = StorageOptions.newBuilder().setProjectId(configuration.getProjectId()).setCredentials(credentials)
                .setRetrySettings(StorageOptions.getDefaultRetrySettings().toBuilder().setMaxAttempts(1).build())
                .build().getService();
            return new GoogleCloudPrivateDownloadAdapter(storage, credentials, properties.getStorage().getBucket(), clock);
        } catch (IOException | RuntimeException error) {
            throw new IllegalStateException("Private download preparation unavailable");
        }
    }
}
