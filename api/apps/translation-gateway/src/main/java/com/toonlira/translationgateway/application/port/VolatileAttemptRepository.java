package com.toonlira.translationgateway.application.port;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Sanitized receipts only; deliberately cannot accept image, text, hash or object references. */
public interface VolatileAttemptRepository {
    enum Status { STARTED, FINISHED, FAILED }
    record Receipt(UUID operationRef, Status status, Instant createdAt, Instant finishedAt, String errorCode) { }
    Optional<Receipt> find(UUID installation, UUID idempotencyKey);
    Receipt reserve(UUID installation, UUID idempotencyKey, UUID operationRef, Instant now, int installationQuota, int globalQuota);
    void finish(UUID operationRef, Status status, String errorCode, Instant now);
    int deleteExpired(Instant cutoff, int limit);
}
