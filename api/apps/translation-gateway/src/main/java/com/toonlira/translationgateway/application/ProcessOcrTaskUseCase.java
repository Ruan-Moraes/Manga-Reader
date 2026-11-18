package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrRegionGrouper;
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
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProcessOcrTaskUseCase {
    private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(ProcessOcrTaskUseCase.class);
    private final OcrPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final MediaInspectionService inspector;
    private final OcrPort ocr;
    private final OcrManifestService manifests;
    private final GatewayProperties properties;
    private final Clock clock;
    private final ShadowLayoutService layouts;
    private final CleanupLifecycleObjectsUseCase lifecycle;
    private final OcrRereadService reread;
    private final com.toonlira.translationgateway.application.port.LexiconPort lexicons;

    public ProcessOcrTaskUseCase(OcrPersistenceUseCase persistence, ObjectStoragePort storage,
                                 MediaInspectionService inspector, OcrPort ocr, OcrManifestService manifests,
                                 GatewayProperties properties, Clock clock, CleanupLifecycleObjectsUseCase lifecycle) {
        this(persistence, storage, inspector, ocr, manifests, properties, clock, null, lifecycle);
    }

    public ProcessOcrTaskUseCase(OcrPersistenceUseCase persistence, ObjectStoragePort storage,
                                 MediaInspectionService inspector, OcrPort ocr, OcrManifestService manifests,
                                 GatewayProperties properties, Clock clock, ShadowLayoutService layouts,
                                 CleanupLifecycleObjectsUseCase lifecycle) {
        this(persistence, storage, inspector, ocr, manifests, properties, clock, layouts, lifecycle, null);
    }

    public ProcessOcrTaskUseCase(OcrPersistenceUseCase persistence, ObjectStoragePort storage,
                                 MediaInspectionService inspector, OcrPort ocr, OcrManifestService manifests,
                                 GatewayProperties properties, Clock clock, ShadowLayoutService layouts,
                                 CleanupLifecycleObjectsUseCase lifecycle, OcrRereadService reread) {
        this(persistence, storage, inspector, ocr, manifests, properties, clock, layouts, lifecycle, reread, null);
    }

    /** {@code lexicons}: language resources for repairing lettering misreadings; may be null. */
    @Autowired
    public ProcessOcrTaskUseCase(OcrPersistenceUseCase persistence, ObjectStoragePort storage,
                                 MediaInspectionService inspector, OcrPort ocr, OcrManifestService manifests,
                                 GatewayProperties properties, Clock clock, ShadowLayoutService layouts,
                                 CleanupLifecycleObjectsUseCase lifecycle, OcrRereadService reread,
                                 com.toonlira.translationgateway.application.port.LexiconPort lexicons) {
        this.lexicons = lexicons;
        this.persistence = persistence;
        this.storage = storage;
        this.inspector = inspector;
        this.ocr = ocr;
        this.manifests = manifests;
        this.properties = properties;
        this.clock = clock;
        this.layouts = layouts;
        this.lifecycle = lifecycle;
        this.reread = reread;
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
            // In layout mode "grouping" detected balloons decide which words form one speech: paragraphs that cross a
            // balloon border are split, then grouped per balloon. Otherwise (or if the detector fails) the proximity
            // heuristic groups whole paragraphs. The same detections feed the layout artifact below.
            var detections = layouts == null ? null : layouts.detectForGrouping(media.path());
            var command = new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), media.widthPx(), media.heightPx());
            var bubbles = ShadowLayoutService.boxes(detections);
            // Word geometry and confidences are needed by balloon splitting and by re-reading doubtful paragraphs.
            boolean rereading = reread != null && reread.enabled();
            List<OcrManifest.Region> paragraphs;
            List<com.toonlira.translationgateway.domain.OcrParagraph> read = List.of();
            if (bubbles == null && !rereading) paragraphs = ocr.recognize(command);
            else {
                read = ocr.recognizeParagraphs(command);
                // Text the provider skipped entirely (short balloons like 「わーい」) is read again where the detector
                // saw lettering; recovered boxes join the page as ordinary paragraphs before grouping.
                if (rereading && detections != null)
                    read = reread.recover(read, detections.texts(), media.path(), job.sourceLanguage(), job.jobRef(),
                        media.widthPx(), media.heightPx());
                read = com.toonlira.translationgateway.domain.OcrParagraph.withoutGuesses(read);
                paragraphs = null;
            }
            // Same assembly as the offline corpus replay (CorpusOcrReplayTest), so the regression gate sees what ships.
            var regions = paragraphs == null
                ? com.toonlira.translationgateway.domain.ocr.OcrAssembly.fitTextBoxes(
                    com.toonlira.translationgateway.domain.ocr.OcrAssembly.group(read, bubbles, job.sourceLanguage(), media.widthPx(), media.heightPx()),
                    detections == null ? List.of() : detections.texts())
                : OcrRegionGrouper.group(paragraphs, job.sourceLanguage(), media.widthPx(), media.heightPx(), bubbles);
            // Doubtful speeches are re-read whole, after grouping: context is what lets the provider read "THIS OS"
            // where a lone "05..." fragment stays ambiguous.
            if (rereading) regions = reread.improveRegions(regions, read, media.path(), job.sourceLanguage(), media.widthPx(), media.heightPx());
            var lexicon = lexicons == null ? com.toonlira.translationgateway.domain.ocr.Lexicon.NONE : lexicons.forLanguage(job.sourceLanguage());
            regions = com.toonlira.translationgateway.domain.ocr.OcrAssembly.finish(regions, job.sourceLanguage(), lexicon);
            requireOriginal(job);
            var manifest = new OcrManifest("1.0", job.jobRef(), job.sourceLanguage(), job.widthPx(), job.heightPx(), regions);
            var encoded = manifests.encode(manifest);
            manifestSha256 = encoded.sha256();
            if (layouts != null) layout = layouts.prepare(job.id(), media.path(), manifest, media.sha256(), encoded.sha256(), detections);
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
            LOG.warn("ocr failed: {}", FailureDiagnostics.describe(error));
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
