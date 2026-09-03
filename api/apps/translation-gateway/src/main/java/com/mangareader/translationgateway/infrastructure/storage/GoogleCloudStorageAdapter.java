package com.mangareader.translationgateway.infrastructure.storage;

import static com.mangareader.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.BlobListOption;
import com.google.cloud.storage.Storage.BlobWriteOption;
import com.google.cloud.storage.StorageException;
import com.google.cloud.storage.StorageOptions;
import com.mangareader.translationgateway.application.port.ObjectStoragePort;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.application.config.GatewayProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "gateway.storage", name = "mode", havingValue = "gcs")
public class GoogleCloudStorageAdapter implements ObjectStoragePort {
    private final Storage storage;
    private final String bucket;

    public GoogleCloudStorageAdapter(GatewayProperties properties) {
        this(StorageOptions.getDefaultInstance().getService(), properties.getStorage().getBucket());
    }

    GoogleCloudStorageAdapter(Storage storage, String bucket) {
        this.storage = storage;
        this.bucket = bucket;
        if (bucket.isBlank()) throw new IllegalStateException("GATEWAY_STORAGE_BUCKET is required for gcs mode");
    }

    @Override
    public void store(String objectKey, Path source, String mimeType, String sha256, Instant createdAt) {
        try (var input = Files.newInputStream(source)) {
            var info = BlobInfo.newBuilder(BlobId.of(bucket, objectKey)).setContentType(mimeType)
                .setMetadata(Map.of("sha256", sha256, "created-at", createdAt.toString())).build();
            storage.createFrom(info, input, BlobWriteOption.doesNotExist());
        } catch (IOException | StorageException error) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    @Override
    public void delete(String objectKey) {
        try { storage.delete(BlobId.of(bucket, objectKey)); } catch (StorageException ignored) { }
    }

    @Override
    public int deleteOlderThan(Instant cutoff) {
        int deleted = 0;
        try {
            for (var blob : storage.list(bucket, BlobListOption.prefix("private/")).iterateAll()) {
                var created = blob.getCreateTimeOffsetDateTime();
                if (created != null && created.toInstant().isBefore(cutoff) && storage.delete(blob.getBlobId())) deleted++;
            }
            return deleted;
        } catch (StorageException error) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }
}
