package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.toonlira.translationgateway.domain.rendering.PrivateDownloadRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!worker")
public class GetJobResultUseCase {
    private static final int MAX_RESULT_RETENTION_SECONDS = 3600;
    private static final int MAX_URL_LIFETIME_SECONDS = 300;
    private final JobResultSnapshotUseCase snapshots;
    private final PrivateDownloadPort downloads;
    private final GatewayProperties properties;
    private final Clock clock;

    public GetJobResultUseCase(JobResultSnapshotUseCase snapshots, PrivateDownloadPort downloads,
                               GatewayProperties properties, Clock clock) {
        this.snapshots = snapshots; this.downloads = downloads; this.properties = properties; this.clock = clock;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Result byRef(UUID owner, UUID ref) { return deliver(owner, snapshots.byRef(owner, ref)); }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Result byIdempotency(UUID owner, UUID key) { return deliver(owner, snapshots.byIdempotency(owner, key)); }

    private Result deliver(UUID owner, JobResultSnapshotUseCase.Snapshot initial) {
        if (initial == null || !initial.job().installationId().equals(owner)) throw unavailable();
        if (initial.job().status() != JobStatus.READY) return result(initial.job(), null);
        var reference = initial.reference();
        int retention = properties.getDisclosure().getResultRetentionSeconds();
        if (retention <= 0 || retention > MAX_RESULT_RETENTION_SECONDS || reference.completedAt().isAfter(clock.instant())) throw unavailable();
        var deadline = reference.completedAt().plusSeconds(retention);
        if (reference.resultExpiresAt().isBefore(deadline)) deadline = reference.resultExpiresAt();
        if (!deadline.isAfter(clock.instant())) throw unavailable();
        PrivateDownload image;
        PrivateDownload manifest;
        try {
            image = downloads.sign(new PrivateDownloadRequest(reference.imageObjectKey(), PrivateDownloadRequest.Kind.IMAGE,
                reference.imageSha256(), reference.imageByteSize(), deadline));
            manifest = downloads.sign(new PrivateDownloadRequest(reference.manifestObjectKey(), PrivateDownloadRequest.Kind.MANIFEST,
                reference.manifestSha256(), null, deadline));
        } catch (RuntimeException ignored) {
            var current = snapshots.byRef(owner, initial.job().jobRef());
            if (!current.job().installationId().equals(owner) || !current.job().id().equals(initial.job().id())) throw unavailable();
            if (current.job().status() != JobStatus.READY) return result(current.job(), null);
            throw unavailable();
        }
        var current = snapshots.byRef(owner, initial.job().jobRef());
        if (!current.job().installationId().equals(owner) || !current.job().id().equals(initial.job().id())) throw unavailable();
        if (current.job().status() != JobStatus.READY) return result(current.job(), null);
        if (!reference.equals(current.reference()) || current.job().errorCode() != null) throw unavailable();
        var now = clock.instant();
        validate(image, PrivateDownloadRequest.Kind.IMAGE, reference.imageSha256(), reference.imageByteSize(), now, deadline);
        validate(manifest, PrivateDownloadRequest.Kind.MANIFEST, reference.manifestSha256(), null, now, deadline);
        return new Result(current.job(), now, new ReadyResult(reference.widthPx(), reference.heightPx(), deadline, image, manifest));
    }

    private void validate(PrivateDownload download, PrivateDownloadRequest.Kind kind, String hash, Long bytes,
                           Instant now, Instant deadline) {
        if (download == null || !kind.mimeType().equals(download.mimeType()) || !hash.equals(download.sha256())
            || (bytes != null && bytes != download.byteSize()) || !download.expiresAt().isAfter(now)
            || download.expiresAt().isAfter(now.plusSeconds(MAX_URL_LIFETIME_SECONDS)) || download.expiresAt().isAfter(deadline)) throw unavailable();
    }
    private Result result(ProcessingJob job, ReadyResult result) { return new Result(job, clock.instant(), result); }
    private GatewayException unavailable() { return new GatewayException(STORAGE_UNAVAILABLE, 503, true); }

    public record ReadyResult(int widthPx, int heightPx, Instant expiresAt, PrivateDownload image, PrivateDownload manifest) {
        @Override public String toString() { return "ReadyResult[redacted]"; }
    }
    public record Result(ProcessingJob job, Instant serverTime, ReadyResult result) {
        public Result {
            if (job == null || serverTime == null || (job.status() == JobStatus.READY) != (result != null)) {
                throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
            }
        }
        @Override public String toString() { return "JobResult[redacted]"; }
    }
}
