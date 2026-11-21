package com.toonlira.translationgateway.application.port;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import com.toonlira.translationgateway.domain.rendering.RenderTextCounts;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Transactional state only. File processing and object storage remain outside this port. */
public interface RenderingJobRepository {
    Optional<WorkItem> find(UUID jobRef);
    boolean originalAvailable(UUID jobId, Instant now);
    Claim claim(UUID jobRef, Instant now);
    boolean complete(UUID jobId, Artifacts artifacts, Instant now);
    void failUnclaimed(UUID jobId, GatewayErrorCode code, Instant now);
    void fail(UUID jobId, GatewayErrorCode code, Instant now);
    /** Returns owned originals to remove outside the transaction; no render is retried. */
    List<String> failStale(Instant cutoff, Instant now, int limit);

    record WorkItem(UUID id, UUID jobRef, JobStatus status, String originalObjectKey, RenderSource source,
                    String sourceLanguage, String targetLanguage, Instant createdAt,
                    String ocrObjectKey, String ocrSha256, String translationObjectKey, String translationSha256,
                    Artifacts artifacts, int resultRetentionSeconds, String layoutObjectKey, String layoutSha256) {
        public WorkItem { OriginalObjectKey.requireSeconds(resultRetentionSeconds); }
        /** Without a layout artifact (layout disabled, failed, or not recorded). */
        public WorkItem(UUID id, UUID jobRef, JobStatus status, String originalObjectKey, RenderSource source,
                        String sourceLanguage, String targetLanguage, Instant createdAt,
                        String ocrObjectKey, String ocrSha256, String translationObjectKey, String translationSha256,
                        Artifacts artifacts, int resultRetentionSeconds) {
            this(id, jobRef, status, originalObjectKey, source, sourceLanguage, targetLanguage, createdAt, ocrObjectKey,
                ocrSha256, translationObjectKey, translationSha256, artifacts, resultRetentionSeconds, null, null);
        }
        public WorkItem(UUID id, UUID jobRef, JobStatus status, String originalObjectKey, RenderSource source,
                        String sourceLanguage, String targetLanguage, Instant createdAt,
                        String ocrObjectKey, String ocrSha256, String translationObjectKey, String translationSha256, Artifacts artifacts) {
            this(id, jobRef, status, originalObjectKey, source, sourceLanguage, targetLanguage, createdAt,
                ocrObjectKey, ocrSha256, translationObjectKey, translationSha256, artifacts, 3600);
        }
        @Override public String toString() { return "RenderingWorkItem[redacted]"; }
    }

    /** {@code text} is null only for results rendered before quality was persisted. */
    record Artifacts(String imageObjectKey, RenderedImage image, String manifestObjectKey, String manifestSha256,
                     RenderTextCounts text) {
        public Artifacts(String imageObjectKey, RenderedImage image, String manifestObjectKey, String manifestSha256) {
            this(imageObjectKey, image, manifestObjectKey, manifestSha256, null);
        }
        public Artifacts {
            if (!validKey(imageObjectKey) || !validKey(manifestObjectKey) || imageObjectKey.equals(manifestObjectKey)
                || image == null || image.byteSize() > RenderPolicy.MAX_OUTPUT_BYTES
                || manifestSha256 == null || !manifestSha256.matches("[0-9a-f]{64}")) {
                throw new RenderValidationException(INVALID_OUTPUT);
            }
            sharedExpiry(imageObjectKey, manifestObjectKey);
        }
        public Optional<Instant> resultExpiresAt() { return sharedExpiry(imageObjectKey, manifestObjectKey); }
        private static Optional<Instant> sharedExpiry(String imageKey, String manifestKey) {
            try {
                var image = ResultObjectKey.expiry(imageKey);
                var manifest = ResultObjectKey.expiry(manifestKey);
                if (!image.equals(manifest)) throw new RenderValidationException(INVALID_OUTPUT);
                return image;
            } catch (IllegalArgumentException invalid) { throw new RenderValidationException(INVALID_OUTPUT); }
        }
        private static boolean validKey(String key) { return key != null && !key.isBlank() && key.length() <= 512; }
        @Override public String toString() { return "RenderingArtifacts[redacted]"; }
    }

    enum Claim { STARTED, CANCELLED, ALREADY_HANDLED }
}
