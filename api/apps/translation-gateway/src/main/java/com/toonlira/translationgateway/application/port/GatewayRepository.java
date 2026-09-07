package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.Installation;
import com.toonlira.translationgateway.domain.ProcessingJob;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GatewayRepository {
    void createInstallation(UUID id, String credentialHash, Instant now);

    Optional<Installation> findInstallationForUpdate(UUID id);

    void touchInstallation(UUID id, Instant now);

    void createSession(UUID id, UUID installationId, String tokenHash, Instant createdAt, Instant expiresAt);

    Optional<UUID> authenticateSession(String tokenHash, Instant now);

    Optional<ProcessingJob> findByIdempotency(UUID installationId, UUID idempotencyKey);

    Optional<ProcessingJob> findByJobRef(UUID installationId, UUID jobRef);

    void acquireGlobalQuotaLock(long utcEpochDay);

    long countInstallationJobs(UUID installationId, Instant dayStart, Instant dayEnd);

    long countGlobalJobs(Instant dayStart, Instant dayEnd);

    ProcessingJob insertJob(NewJob job);

    ProcessingJob cancel(UUID installationId, UUID jobRef, Instant now);

    List<DispatchClaim> claimDispatches(int limit, Instant now, Instant leaseUntil);

    void markDispatched(UUID jobId, Instant now);

    void rescheduleDispatch(UUID jobId, Instant nextAttemptAt, String errorCode, boolean exhausted, Instant now);

    int deleteExpiredSessions(Instant now);

    int deleteExpiredMetadata(Instant now);

    record NewJob(
        UUID id,
        UUID jobRef,
        UUID installationId,
        UUID idempotencyKey,
        UUID attemptRef,
        String disclosureVersion,
        String sourceLanguage,
        String targetLanguage,
        String mimeType,
        long byteSize,
        int widthPx,
        int heightPx,
        String objectKey,
        String originalSha256,
        String requestFingerprint,
        Instant now,
        Instant metadataExpiresAt
    ) {
    }

    record DispatchClaim(UUID jobId, UUID jobRef, int attemptCount) {
    }
}
