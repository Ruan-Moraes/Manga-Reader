package com.toonlira.translationgateway.infrastructure.storage;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.BlobListOption;
import com.google.cloud.storage.Storage.BlobWriteOption;
import com.google.cloud.storage.StorageException;
import com.google.cloud.storage.StorageOptions;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.io.IOException;
import java.io.InputStream;
import java.nio.channels.Channels;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Map;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.Optional;
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
        try { OriginalObjectKey.validateForStore(objectKey, createdAt); ResultObjectKey.validateForStore(objectKey, createdAt); }
        catch (IllegalArgumentException invalid) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
        try (var input = Files.newInputStream(source)) {
            var info = BlobInfo.newBuilder(BlobId.of(bucket, objectKey)).setContentType(mimeType)
                .setMetadata(Map.of("sha256", sha256, "created-at", createdAt.toString())).build();
            storage.createFrom(info, input, BlobWriteOption.doesNotExist());
        } catch (IOException | StorageException error) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    @Override
    public InputStream open(String objectKey) {
        try { return Channels.newInputStream(storage.reader(BlobId.of(bucket, objectKey))); }
        catch (StorageException error) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
    }

    @Override
    public void delete(String objectKey) {
        try { storage.delete(BlobId.of(bucket, objectKey)); }
        catch (StorageException error) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
    }

    @Override
    public int deleteOlderThan(Instant cutoff) {
        return sweep("private/", cutoff, (key, created) -> created);
    }

    @Override
    public int deleteExpiredOriginals(Instant now) {
        return sweep(OriginalObjectKey.PREFIX, now, (key, created) -> deadline(key, created, OriginalObjectKey::expiry));
    }

    @Override
    public int deleteExpiredResults(Instant now) {
        return sweep(ResultObjectKey.PREFIX, now, (key, created) -> deadline(key, created, ResultObjectKey::expiry));
    }

    private Instant deadline(String key, Instant created, Function<String, Optional<Instant>> locator) {
        var snapshot = locator.apply(key);
        Instant bound = created == null ? null : created.plusSeconds(3600);
        var expiry = snapshot.orElse(bound);
        return expiry != null && bound != null && bound.isBefore(expiry) ? bound : expiry;
    }

    private int sweep(String prefix, Instant cutoff, BiFunction<String, Instant, Instant> expiryRule) {
        int deleted = 0;
        boolean failed = false;
        try {
            for (var blob : storage.list(bucket, BlobListOption.prefix(prefix)).iterateAll()) {
                try {
                    var id = blob.getBlobId();
                    if (!bucket.equals(id.getBucket()) || !id.getName().startsWith(prefix)) continue;
                    var created = blob.getCreateTimeOffsetDateTime();
                    var expiry = expiryRule.apply(id.getName(), created == null ? null : created.toInstant());
                    if (expiry == null) { failed = true; continue; }
                    if (!expiry.isAfter(cutoff) && storage.delete(id)) deleted++;
                } catch (RuntimeException unavailable) { failed = true; }
            }
        } catch (RuntimeException unavailable) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
        if (failed) throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        return deleted;
    }
}
