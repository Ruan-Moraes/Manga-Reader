package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.layout.LayoutOutcome;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OcrJobRepository {
    Optional<WorkItem> find(UUID jobRef);
    Optional<OutputArtifact> findOutput(UUID jobId);
    boolean originalAvailable(UUID jobId, Instant now);

    Claim claim(UUID jobRef, Instant now);

    boolean complete(UUID jobId, String objectKey, String sha256, Instant now);

    boolean completeWithLayout(UUID jobId, String objectKey, String sha256, Instant now, LayoutOutcome layout);

    void fail(UUID jobId, GatewayErrorCode errorCode, Instant now);
    void failUnclaimed(UUID jobId, GatewayErrorCode errorCode, Instant now);

    List<String> failStale(Instant cutoff, Instant now, int limit);

    record WorkItem(UUID id, UUID jobRef, JobStatus status, String objectKey, String sha256,
                    String mimeType, long byteSize, int widthPx, int heightPx, String sourceLanguage) { }

    enum Claim { STARTED, CANCELLED, ALREADY_HANDLED }

    record OutputArtifact(String objectKey, String sha256) {
        @Override public String toString() { return "OcrOutputArtifact[redacted]"; }
    }
}
