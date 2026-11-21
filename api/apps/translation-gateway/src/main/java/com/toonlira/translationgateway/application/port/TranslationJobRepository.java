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

    /**
     * {@code installationId} and {@code contextRef} (null without a chapter) select the chapter memory. The layout
     * artifact ({@code layoutObjectKey}/{@code layoutSha256}, null when layout failed or is off) and the original's
     * {@code imageSha256} tell the review what kind of text each region is.
     */
    record WorkItem(UUID id, UUID jobRef, JobStatus status, String sourceLanguage,
                    String targetLanguage, String ocrObjectKey, String ocrSha256,
                    String translationObjectKey, String translationSha256, UUID installationId, UUID contextRef,
                    String imageSha256, String layoutObjectKey, String layoutSha256) {
        public WorkItem(UUID id, UUID jobRef, JobStatus status, String sourceLanguage, String targetLanguage,
                        String ocrObjectKey, String ocrSha256, String translationObjectKey, String translationSha256,
                        UUID installationId, UUID contextRef) {
            this(id, jobRef, status, sourceLanguage, targetLanguage, ocrObjectKey, ocrSha256, translationObjectKey,
                translationSha256, installationId, contextRef, null, null, null);
        }
        public WorkItem(UUID id, UUID jobRef, JobStatus status, String sourceLanguage, String targetLanguage,
                        String ocrObjectKey, String ocrSha256, String translationObjectKey, String translationSha256) {
            this(id, jobRef, status, sourceLanguage, targetLanguage, ocrObjectKey, ocrSha256, translationObjectKey,
                translationSha256, null, null, null, null, null);
        }
        @Override public String toString() { return "TranslationWorkItem[redacted]"; }
    }
    enum Claim { STARTED, CANCELLED, ALREADY_HANDLED }
}
