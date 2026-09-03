package com.mangareader.translationgateway.domain;

import java.time.Instant;
import java.util.UUID;

public record ProcessingJob(
    UUID id,
    UUID jobRef,
    UUID installationId,
    UUID idempotencyKey,
    UUID attemptRef,
    String requestFingerprint,
    JobStatus status,
    DispatchStatus dispatchStatus,
    String errorCode,
    Instant serverTime
) {
}
