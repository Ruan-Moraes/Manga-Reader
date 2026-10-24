package com.toonlira.translationgateway.application.port;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ResultAcknowledgementRepository {
    void request(UUID installationId, UUID jobRef, Instant now);

    boolean expire(UUID installationId, UUID jobRef, Instant now, Instant completedBefore);

    int expireBatch(int limit, Instant now, Instant completedBefore);

    List<CleanupClaim> claim(int limit, Instant now, Instant leaseUntil);

    boolean complete(UUID jobId, Instant leaseUntil, Instant now);

    void reschedule(UUID jobId, Instant leaseUntil, Instant nextAttemptAt);

    record CleanupClaim(UUID jobId, Instant leaseUntil, List<String> objectKeys) {
        public CleanupClaim { objectKeys = List.copyOf(objectKeys); }
        @Override public String toString() { return "CleanupClaim[redacted]"; }
    }
}
