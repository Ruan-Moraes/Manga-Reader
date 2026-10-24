package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.INTERNAL_ERROR;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrLimits;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Coordinates bounded private files. Only the persistence wrapper opens database transactions. */
@Service
public class ProcessRenderingTaskUseCase {
    private static final Duration ORIGINAL_TTL = Duration.ofHours(1);
    private static final int MAX_TRANSLATION_MANIFEST_BYTES = 4 * 1024 * 1024;
    private final RenderingPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final MediaInspectionService inspector;
    private final OcrManifestService ocrManifests;
    private final TranslationManifestService translationManifests;
    private final RenderManifestService renderManifests;
    private final ObjectProvider<RenderPort> renderer;
    private final GatewayProperties properties;
    private final Clock clock;
    private final CleanupLifecycleObjectsUseCase lifecycle;

    public ProcessRenderingTaskUseCase(RenderingPersistenceUseCase persistence, ObjectStoragePort storage,
                                       MediaInspectionService inspector, OcrManifestService ocrManifests,
                                       TranslationManifestService translationManifests, RenderManifestService renderManifests,
                                       ObjectProvider<RenderPort> renderer, GatewayProperties properties, Clock clock,
                                       CleanupLifecycleObjectsUseCase lifecycle) {
        this.persistence = persistence;
        this.storage = storage;
        this.inspector = inspector;
        this.ocrManifests = ocrManifests;
        this.translationManifests = translationManifests;
        this.renderManifests = renderManifests;
        this.renderer = renderer;
        this.properties = properties;
        this.clock = clock;
        this.lifecycle = lifecycle;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void execute(UUID jobRef) {
        if (properties.getRendering().getMode() == GatewayProperties.Rendering.Mode.DISABLED) return;
        var job = persistence.find(jobRef);
        if (job == null) throw new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false);
        try {
            executeJob(jobRef, job);
        } finally {
            lifecycle.executeForJob(job.id());
        }
    }

    private void executeJob(UUID jobRef, RenderingJobRepository.WorkItem job) {
        if (job.status() == JobStatus.CANCEL_PENDING) {
            if (persistence.claim(jobRef, now()) == RenderingJobRepository.Claim.CANCELLED) deleteBestEffort(job.originalObjectKey());
            return;
        }
        if (job.status() != JobStatus.RENDERING) {
            if (job.status().terminal()) deleteBestEffort(job.originalObjectKey());
            return;
        }

        MediaInspectionService.InspectedMedia original = null;
        try {
            RenderRequest request;
            try {
                if (!jobRef.equals(job.jobRef())) invalid();
                checkRetention(job);
                request = readRequest(job);
                try (var input = storage.open(job.originalObjectKey())) {
                    original = inspector.inspect(input, request.policy().maxOriginalBytes());
                }
                if (!source(original).equals(job.source())) invalid();
            } catch (RuntimeException | IOException error) {
                persistence.failUnclaimed(job.id(), INTERNAL_ERROR, now());
                deleteOriginalIfTerminal(job);
                return;
            }
            var claim = persistence.claim(jobRef, now());
            if (claim == RenderingJobRepository.Claim.CANCELLED) deleteBestEffort(job.originalObjectKey());
            if (claim != RenderingJobRepository.Claim.STARTED) return;
            processClaimed(job, original.path(), request);
        } finally {
            if (original != null) inspector.deleteQuietly(original.path());
        }
    }

    private RenderRequest readRequest(RenderingJobRepository.WorkItem job) throws IOException {
        var policy = policy();
        var ocrBytes = readVerified(job.ocrObjectKey(), job.ocrSha256(), OcrLimits.MAX_MANIFEST_BYTES);
        var ocr = ocrManifests.decode(ocrBytes);
        if (!job.jobRef().equals(ocr.jobRef()) || !job.sourceLanguage().equals(ocr.sourceLanguage())) invalid();
        var pair = new LanguagePair(job.sourceLanguage(), job.targetLanguage());
        var translationRequest = new TranslationRequest(job.jobRef(), pair, ocr.regions().stream()
            .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
        var translationBytes = readVerified(job.translationObjectKey(), job.translationSha256(), MAX_TRANSLATION_MANIFEST_BYTES);
        var translation = translationManifests.decode(translationBytes, job.translationSha256(), translationRequest, job.ocrSha256());
        return RenderRequest.create(job.source(), ocr, translation, job.ocrSha256(), job.translationSha256(), policy);
    }

    private RenderPolicy policy() {
        var initial = RenderPolicy.initial();
        var media = properties.getMedia();
        return new RenderPolicy(initial.version(), Math.min(media.getMaxBytes(), initial.maxOriginalBytes()),
            Math.min(media.getMaxWidthPx(), initial.maxWidthPx()), Math.min(media.getMaxHeightPx(), initial.maxHeightPx()),
            Math.min(media.getMaxPixels(), initial.maxPixels()), initial.maxOutputBytes(), initial.maxManifestBytes(),
            initial.minimumFontPx(), initial.maximumFontPx(), initial.paddingPx());
    }

    private byte[] readVerified(String key, String hash, int limit) throws IOException {
        if (key == null || key.isBlank() || hash == null || !hash.matches("[0-9a-f]{64}")) invalid();
        byte[] bytes;
        try (var input = storage.open(key)) { bytes = input.readNBytes(limit + 1); }
        if (bytes.length == 0 || bytes.length > limit || !MessageDigest.isEqual(digest(bytes), HexFormat.of().parseHex(hash))) invalid();
        return bytes;
    }

    private void processClaimed(RenderingJobRepository.WorkItem job, Path original, RenderRequest request) {
        Path outputFile = null, manifestFile = null, inspectedOutput = null;
        String imageKey = null, manifestKey = null;
        RenderingJobRepository.Artifacts artifacts = null;
        try {
            var output = renderer.getObject().render(original, request);
            outputFile = ownedOutput(output, original);
            MediaInspectionService.InspectedMedia checked;
            try (var input = Files.newInputStream(outputFile, LinkOption.NOFOLLOW_LINKS)) {
                checked = inspector.inspect(input, request.policy().maxOutputBytes());
            }
            inspectedOutput = checked.path();
            var image = new RenderedImage(checked.mimeType(), checked.byteSize(), checked.widthPx(), checked.heightPx(), checked.sha256());
            var encoded = renderManifests.encode(output.manifest(), request.policy());
            renderManifests.decode(encoded.bytes(), encoded.sha256(), request, image);
            checkRetention(job);
            manifestFile = Files.createTempFile("translation-render-manifest-", ".json");
            Files.write(manifestFile, encoded.bytes());
            var resultDeadline = now().truncatedTo(ChronoUnit.MICROS).plusSeconds(job.resultRetentionSeconds());
            imageKey = ResultObjectKey.create(resultDeadline, "webp");
            manifestKey = ResultObjectKey.create(resultDeadline, "json");
            artifacts = new RenderingJobRepository.Artifacts(imageKey, image, manifestKey, encoded.sha256());
            // Upload the checked compressed snapshot, not a path that a renderer could modify after verification.
            storage.store(imageKey, inspectedOutput, image.mimeType(), image.sha256(), now());
            storage.store(manifestKey, manifestFile, "application/json", encoded.sha256(), now());
            checkRetention(job);
            if (!resultDeadline.isAfter(now())) invalid();
            if (persistence.complete(job.id(), artifacts, now())) deleteBestEffort(job.originalObjectKey());
            else {
                discard(imageKey, manifestKey);
                deleteOriginalIfTerminal(job);
            }
        } catch (RuntimeException | IOException error) {
            var current = findBestEffort(job.jobRef());
            // Exact references survive READY -> RESULT_EXPIRED; uncertain DB state must not delete an accepted result.
            boolean committed = artifacts != null && current != null && artifacts.equals(current.artifacts());
            if (!committed && current != null) {
                try {
                    // Resolve an in-flight commit under the existing job lock before touching its uploads.
                    persistence.fail(job.id(), INTERNAL_ERROR, now());
                    current = persistence.find(job.jobRef());
                    committed = artifacts != null && current != null && artifacts.equals(current.artifacts());
                } catch (RuntimeException uncertain) { current = null; }
            }
            if (committed) deleteBestEffort(job.originalObjectKey());
            else if (current != null) {
                discard(imageKey, manifestKey);
                deleteOriginalIfTerminal(job);
            }
        } finally {
            inspector.deleteQuietly(outputFile);
            inspector.deleteQuietly(inspectedOutput);
            inspector.deleteQuietly(manifestFile);
        }
    }

    private Path ownedOutput(RenderPort.Output output, Path original) throws IOException {
        if (output == null) invalid();
        var path = output.path();
        var directory = properties.getRendering().getTemporaryDirectory();
        if (directory == null || path == null || !path.isAbsolute()
            || !Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)
            || !path.getParent().equals(directory.toRealPath()) || !path.getFileName().toString().startsWith("render-")
            || !path.getFileName().toString().endsWith(".webp") || Files.isSameFile(path, original)) invalid();
        return path;
    }

    private void checkRetention(RenderingJobRepository.WorkItem job) {
        if (job.createdAt() == null || now().isBefore(job.createdAt()) || !now().isBefore(job.createdAt().plus(ORIGINAL_TTL))
            || !persistence.originalAvailable(job.id(), now())) invalid();
    }

    private void deleteOriginalIfTerminal(RenderingJobRepository.WorkItem job) {
        var current = findBestEffort(job.jobRef());
        if (current != null && current.status().terminal()) deleteBestEffort(job.originalObjectKey());
    }

    private RenderingJobRepository.WorkItem findBestEffort(UUID jobRef) {
        try { return persistence.find(jobRef); } catch (RuntimeException ignored) { return null; }
    }

    private static RenderSource source(MediaInspectionService.InspectedMedia media) {
        return new RenderSource(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256());
    }

    private static byte[] digest(byte[] bytes) {
        try { return MessageDigest.getInstance("SHA-256").digest(bytes); }
        catch (NoSuchAlgorithmException error) { throw new IllegalStateException("SHA-256 unavailable"); }
    }

    private Instant now() { return Instant.now(clock); }
    private static void invalid() { throw new GatewayException(INTERNAL_ERROR, 500, false); }
    private void discard(String imageKey, String manifestKey) {
        if (imageKey != null) deleteBestEffort(imageKey);
        if (manifestKey != null) deleteBestEffort(manifestKey);
    }
    private void deleteBestEffort(String key) { try { storage.delete(key); } catch (RuntimeException ignored) { } }
}
