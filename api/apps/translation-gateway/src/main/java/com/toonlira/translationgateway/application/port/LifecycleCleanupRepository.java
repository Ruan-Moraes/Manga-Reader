package com.toonlira.translationgateway.application.port;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Intent only; never marks READY as acknowledged or stores object content. */
public interface LifecycleCleanupRepository {
    void enqueueEligible(UUID jobId, Instant now);
    int reconcile(int limit, Instant now);
    List<CleanupClaim> claim(int limit, Instant now, Instant leaseUntil);
    Optional<CleanupClaim> claimForJob(UUID jobId, Instant now, Instant leaseUntil);
    boolean complete(UUID jobId, Instant leaseUntil, Instant now);
    void reschedule(UUID jobId, Instant leaseUntil, Instant nextAttemptAt);

    record CleanupClaim(UUID jobId, Instant leaseUntil, List<String> objectKeys) {
        public CleanupClaim { objectKeys = List.copyOf(objectKeys); }
        @Override public String toString() { return "LifecycleCleanupClaim[redacted]"; }
    }
}
