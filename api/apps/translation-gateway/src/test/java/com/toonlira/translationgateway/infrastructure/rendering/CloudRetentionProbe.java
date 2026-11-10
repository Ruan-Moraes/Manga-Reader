package com.toonlira.translationgateway.infrastructure.rendering;

import com.google.cloud.storage.Storage;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.StorageOptions;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.storage.GoogleCloudStorageAdapter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** Opt-in storage observation for a real hour; never claims a scheduler or point-in-time guarantee. */
public final class CloudRetentionProbe {
    private CloudRetentionProbe() { }

    public static void main(String[] arguments) throws Exception {
        var configuration = CloudPrivateDeliveryProbe.configuration(System.getenv());
        CloudPrivateDeliveryProbe.verifyMetadataCredentials();
        var properties = new GatewayProperties();
        properties.getStorage().setBucket(configuration.bucket());
        var adapter = new GoogleCloudStorageAdapter(properties);
        var storage = StorageOptions.getDefaultInstance().getService();
        var created = Instant.now();
        var deadline = created.plusSeconds(OriginalObjectKey.MAX_RETENTION_SECONDS);
        var keys = List.of(OriginalObjectKey.create(created, OriginalObjectKey.MAX_RETENTION_SECONDS),
            ResultObjectKey.create(deadline, "webp"), ResultObjectKey.create(deadline, "json"));
        var inputs = List.of(Path.of("/diagnostic/small.png"), Path.of("/diagnostic/retention.webp"),
            Path.of("/diagnostic/retention-manifest.json"));
        var types = List.of("image/png", "image/webp", "application/json");
        for (int index = 0; index < keys.size(); index++) {
            var file = inputs.get(index);
            var hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(file)));
            adapter.store(keys.get(index), file, types.get(index), hash, created);
            var blob = storage.get(configuration.bucket(), keys.get(index));
            storage.create(BlobInfo.newBuilder(configuration.bucket(), keys.get(index)).setContentType(blob.getContentType())
                .setMetadata(blob.getMetadata()).build(), blob.getContent());
        }
        var report = new LinkedHashMap<String, Object>();
        report.put("createdAt", created.toString());
        report.put("deadline", deadline.toString());
        report.put("retentionSeconds", OriginalObjectKey.MAX_RETENTION_SECONDS);
        report.put("initialGenerations", count(storage, configuration.bucket(), keys));
        report.put("schedulerTested", false);
        report.put("reducedDeadline", false);
        write("retention-start.json", report);
        System.out.println("MOB020_RETENTION_STARTED");
        sleepUntil(deadline.minusSeconds(2));
        report.put("beforeDeadlineObservedAt", Instant.now().toString());
        report.put("beforeDeadlineGenerations", count(storage, configuration.bucket(), keys));
        sleepUntil(deadline);
        var deletionStarted = Instant.now();
        report.put("deletionStartedAt", deletionStarted.toString());
        report.put("generationsAtDeadlineObservation", count(storage, configuration.bucket(), keys));
        report.put("deletedOriginalGenerations", adapter.deleteExpiredOriginals(Instant.now()));
        report.put("deletedResultGenerations", adapter.deleteExpiredResults(Instant.now()));
        var deletionCompleted = Instant.now();
        report.put("deletionCompletedAt", deletionCompleted.toString());
        report.put("deletionObservedAfterDeadlineMillis", Duration.between(deadline, deletionCompleted).toMillis());
        report.put("remainingGenerations", count(storage, configuration.bucket(), keys));
        report.put("pointInTimeGuarantee", false);
        write("retention-result.json", report);
        if (((Number) report.get("remainingGenerations")).intValue() != 0)
            throw new IllegalStateException("cloud-retention-cleanup-incomplete");
    }

    private static int count(Storage storage, String bucket, List<String> keys) {
        int count = 0;
        for (var key : keys) for (var blob : storage.list(bucket, Storage.BlobListOption.prefix(key),
                Storage.BlobListOption.versions(true)).iterateAll()) if (key.equals(blob.getName())) count++;
        return count;
    }

    private static void sleepUntil(Instant deadline) throws InterruptedException {
        while (Instant.now().isBefore(deadline)) {
            long remaining = Duration.between(Instant.now(), deadline).toNanos();
            if (remaining > 0) TimeUnit.NANOSECONDS.sleep(Math.min(remaining, Duration.ofSeconds(30).toNanos()));
        }
    }

    private static void write(String name, LinkedHashMap<String, Object> report) throws Exception {
        Files.write(Path.of("/export").resolve(name), GatewayJsonMapper.create().writeValueAsBytes(report));
    }
}
