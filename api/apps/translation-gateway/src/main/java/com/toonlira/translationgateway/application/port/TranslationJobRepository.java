package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface TranslationJobRepository {
    Optional<WorkItem> find(UUID jobRef);
    boolean originalAvailable(UUID jobId, Instant now);
    Claim claim(UUID jobRef, Instant now);
    boolean complete(UUID jobId, String objectKey, String sha256, Instant now);
    /** Records a validation failure only if no delivery has reserved the stage. */
    void failUnclaimed(UUID jobId, GatewayErrorCode code, Instant now);
    /** Terminal failure of the delivery that owns the RUNNING stage. */
    void fail(UUID jobId, GatewayErrorCode code, Instant now);
    int failStale(Instant cutoff, Instant now, int limit);

    record WorkItem(UUID id, UUID jobRef, JobStatus status, String sourceLanguage,
                    String targetLanguage, String ocrObjectKey, String ocrSha256,
                    String translationObjectKey, String translationSha256) {
        @Override public String toString() { return "TranslationWorkItem[redacted]"; }
    }
    enum Claim { STARTED, CANCELLED, ALREADY_HANDLED }
}
