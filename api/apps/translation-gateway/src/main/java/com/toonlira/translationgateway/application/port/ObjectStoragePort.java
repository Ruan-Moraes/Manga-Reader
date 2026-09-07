package com.toonlira.translationgateway.application.port;

import java.nio.file.Path;
import java.time.Instant;

public interface ObjectStoragePort {
    void store(String objectKey, Path source, String mimeType, String sha256, Instant createdAt);

    void delete(String objectKey);

    int deleteOlderThan(Instant cutoff);
}
