package com.toonlira.translationgateway.infrastructure.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;

/** Test-only access to the injected adapter constructor; no ambient credential discovery. */
public final class EvaluationStorageFactory {
    private EvaluationStorageFactory() { }

    public static StorageOptions options(GoogleCredentials credentials, String project) {
        return StorageOptions.newBuilder().setProjectId(project).setQuotaProjectId(project)
            .setCredentials(credentials).build();
    }

    public static GoogleCloudStorageAdapter adapter(Storage storage, String bucket) {
        return new GoogleCloudStorageAdapter(storage, bucket);
    }
}
