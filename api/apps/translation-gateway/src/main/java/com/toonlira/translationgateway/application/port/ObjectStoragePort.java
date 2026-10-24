package com.toonlira.translationgateway.application.port;

import java.nio.file.Path;
import java.time.Instant;
import java.io.InputStream;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;

public interface ObjectStoragePort {
    void store(String objectKey, Path source, String mimeType, String sha256, Instant createdAt);

    InputStream open(String objectKey);

    void delete(String objectKey);

    int deleteOlderThan(Instant cutoff);

    /** Immutable original deadlines, independent of SQL and later configuration. Unsupported adapters fail closed. */
    default int deleteExpiredOriginals(Instant now) {
        throw new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
    }

    /** Final artifact deadlines must remain purgeable when SQL is unavailable. */
    default int deleteExpiredResults(Instant now) {
        throw new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
    }
}
