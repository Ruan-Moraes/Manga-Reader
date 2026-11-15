package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutOutcome;
import org.springframework.beans.factory.annotation.Autowired;
import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProcessOcrTaskUseCase {
    private final OcrPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final MediaInspectionService inspector;
    private final OcrPort ocr;
    private final OcrManifestService manifests;
    private final GatewayProperties properties;
    private final Clock clock;
    private final ShadowLayoutService layouts;
    private final CleanupLifecycleObjectsUseCase lifecycle;

    public ProcessOcrTaskUseCase(OcrPersistenceUseCase persistence, ObjectStoragePort storage,
                                 MediaInspectionService inspector, OcrPort ocr, OcrManifestService manifests,
                                 GatewayProperties properties, Clock clock, CleanupLifecycleObjectsUseCase lifecycle) {
        this(persistence, storage, inspector, ocr, manifests, properties, clock, null, lifecycle);
    }

    @Autowired
    public ProcessOcrTaskUseCase(OcrPersistenceUseCase persistence, ObjectStoragePort storage,
                                 MediaInspectionService inspector, OcrPort ocr, OcrManifestService manifests,
                                 GatewayProperties properties, Clock clock, ShadowLayoutService layouts,
                                 CleanupLifecycleObjectsUseCase lifecycle) {
        this.persistence = persistence;
        this.storage = storage;
        this.inspector = inspector;
        this.ocr = ocr;
        this.manifests = manifests;
        this.properties = properties;
        this.clock = clock;
        this.layouts = layouts;
        this.lifecycle = lifecycle;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void execute(UUID jobRef) {
        if (!ocr.available()) throw new GatewayException(GatewayErrorCode.OCR_UNAVAILABLE, 503, false);
        var job = persistence.find(jobRef);
        if (job == null) throw new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false);
        try {
            executeJob(jobRef, job);
        } finally {
            lifecycle.executeForJob(job.id());
        }
    }

    private void executeJob(UUID jobRef, OcrJobRepository.WorkItem job) {
        if (job.status() == JobStatus.CANCEL_PENDING) {
            if (persistence.claim(jobRef, Instant.now(clock)) == OcrJobRepository.Claim.CANCELLED) {
                deleteBestEffort(job.objectKey());
            }
            return;
        }
        if (job.status() != JobStatus.QUEUED) return;
        if (!persistence.originalAvailable(job.id(), clock.instant())) {
            persistence.failUnclaimed(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, clock.instant());
            deleteOriginalIfTerminal(job);
            return;
        }

        MediaInspectionService.InspectedMedia media = null;
        try (InputStream input = storage.open(job.objectKey())) {
            media = inspector.inspect(input, properties.getMedia().getMaxBytes());
            if (!matches(job, media)) {
                persistence.failUnclaimed(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, Instant.now(clock));
                deleteOriginalIfTerminal(job);
                return;
            }
            var claim = persistence.claim(jobRef, Instant.now(clock));
            if (claim == OcrJobRepository.Claim.CANCELLED) {
                deleteBestEffort(job.objectKey());
                return;
            }
            if (claim != OcrJobRepository.Claim.STARTED) return;
            processClaimed(job, media);
        } catch (RuntimeException | IOException error) {
            var current = findBestEffort(jobRef);
            if (current != null) {
                var code = error instanceof GatewayException gateway
                    && gateway.code() != GatewayErrorCode.STORAGE_UNAVAILABLE
                    ? GatewayErrorCode.OCR_INVALID_MEDIA : GatewayErrorCode.OCR_UNAVAILABLE;
                persistence.failUnclaimed(job.id(), code, Instant.now(clock));
                deleteOriginalIfTerminal(job);
            }
        } finally {
            if (media != null) inspector.deleteQuietly(media.path());
        }
    }

    private void processClaimed(OcrJobRepository.WorkItem job, MediaInspectionService.InspectedMedia media) {
        Path manifestFile = null;
        String manifestKey = null;
        String manifestSha256 = null;
        LayoutOutcome layout = null;
        try {
            requireOriginal(job);
            var regions = ocr.recognize(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(),
                media.widthPx(), media.heightPx()));
            requireOriginal(job);
            var manifest = new OcrManifest("1.0", job.jobRef(), job.sourceLanguage(), job.widthPx(), job.heightPx(), regions);
            var encoded = manifests.encode(manifest);
            manifestSha256 = encoded.sha256();
            if (layouts != null) layout = layouts.prepare(job.id(), media.path(), manifest, media.sha256(), encoded.sha256());
            manifestFile = Files.createTempFile("translation-ocr-", ".json");
            Files.write(manifestFile, encoded.bytes());
            manifestKey = "private/ocr/" + job.id() + "/" + UUID.randomUUID() + ".json";
            storage.store(manifestKey, manifestFile, "application/json", encoded.sha256(), Instant.now(clock));
            boolean completed = layout == null
                ? persistence.complete(job.id(), manifestKey, encoded.sha256(), Instant.now(clock))
                : persistence.completeWithLayout(job.id(), manifestKey, encoded.sha256(), Instant.now(clock), layout);
            if (!completed) {
                deleteBestEffort(manifestKey);
                if (layouts != null) layouts.discard(layout);
            }
        } catch (RuntimeException | IOException error) {
            // A database commit can succeed even when its acknowledgement is lost.
            // Keep the referenced artifact in that case; an uncertain orphan is
            // reclaimed by the one-hour bucket cleanup instead.
            OcrJobRepository.WorkItem current = null;
            boolean committed = false;
            try {
                current = persistence.find(job.jobRef());
                var output = persistence.findOutput(job.id());
                committed = output != null && manifestKey != null && manifestKey.equals(output.objectKey())
                    && manifestSha256.equals(output.sha256());
            } catch (RuntimeException unavailable) { current = null; }
            var code = error instanceof GatewayException gateway
                && (gateway.code() == GatewayErrorCode.OCR_INVALID_RESPONSE || gateway.code() == GatewayErrorCode.OCR_INVALID_MEDIA)
                ? gateway.code() : GatewayErrorCode.OCR_UNAVAILABLE;
            if (current != null && !committed) {
                try {
                    // Wait for the competing transaction through the existing job lock, then inspect the accepted output.
                    persistence.fail(job.id(), code, Instant.now(clock));
                    current = persistence.find(job.jobRef());
                    var output = persistence.findOutput(job.id());
                    committed = output != null && manifestKey != null && manifestKey.equals(output.objectKey())
                        && manifestSha256.equals(output.sha256());
                } catch (RuntimeException uncertain) { current = null; }
            }
            if (manifestKey != null && !committed && current != null) deleteBestEffort(manifestKey);
            if (!committed && current != null && layouts != null) layouts.discard(layout);
        } finally {
            inspector.deleteQuietly(manifestFile);
            deleteOriginalIfTerminal(job);
        }
    }

    private boolean matches(OcrJobRepository.WorkItem job, MediaInspectionService.InspectedMedia media) {
        return job.byteSize() == media.byteSize() && job.widthPx() == media.widthPx()
            && job.heightPx() == media.heightPx() && job.mimeType().equals(media.mimeType())
            && MessageDigest.isEqual(job.sha256().getBytes(StandardCharsets.US_ASCII),
                media.sha256().getBytes(StandardCharsets.US_ASCII));
    }

    private void requireOriginal(OcrJobRepository.WorkItem job) {
        if (!persistence.originalAvailable(job.id(), clock.instant())) throw new GatewayException(GatewayErrorCode.OCR_INVALID_MEDIA, 422, false);
    }

    private OcrJobRepository.WorkItem findBestEffort(UUID jobRef) {
        try {
            return persistence.find(jobRef);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private void deleteOriginalIfTerminal(OcrJobRepository.WorkItem job) {
        var current = findBestEffort(job.jobRef());
        if (current != null && current.status().terminal()) deleteBestEffort(job.objectKey());
    }

    private void deleteBestEffort(String key) {
        try { storage.delete(key); } catch (RuntimeException ignored) { }
    }
}
