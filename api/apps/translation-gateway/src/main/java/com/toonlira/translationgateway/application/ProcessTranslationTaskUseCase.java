package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.ConfiguredTranslationPairs;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.port.TranslationRefinerPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrLimits;
import com.toonlira.translationgateway.domain.translation.FragmentJoiner;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationLimits;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProcessTranslationTaskUseCase {
    private static final Logger LOG = LoggerFactory.getLogger(ProcessTranslationTaskUseCase.class);
    private final TranslationPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final OcrManifestService ocrManifests;
    private final TranslationManifestService translationManifests;
    private final TranslationPort translation;
    private final TranslationRefinerPort refiner;
    private final GatewayProperties properties;
    private final Clock clock;
    private final CleanupLifecycleObjectsUseCase lifecycle;
    private final ChapterMemoryService chapters;

    public ProcessTranslationTaskUseCase(TranslationPersistenceUseCase persistence, ObjectStoragePort storage,
                                         OcrManifestService ocrManifests, TranslationManifestService translationManifests,
                                         TranslationPort translation, TranslationRefinerPort refiner,
                                         GatewayProperties properties, Clock clock, CleanupLifecycleObjectsUseCase lifecycle) {
        this(persistence, storage, ocrManifests, translationManifests, translation, refiner, properties, clock, lifecycle,
            null, null);
    }

    /** {@code memory} and {@code lexicons} enable the chapter memory (pages sent with a context reference). */
    @org.springframework.beans.factory.annotation.Autowired
    public ProcessTranslationTaskUseCase(TranslationPersistenceUseCase persistence, ObjectStoragePort storage,
                                         OcrManifestService ocrManifests, TranslationManifestService translationManifests,
                                         TranslationPort translation, TranslationRefinerPort refiner,
                                         GatewayProperties properties, Clock clock, CleanupLifecycleObjectsUseCase lifecycle,
                                         com.toonlira.translationgateway.application.port.ChapterMemoryRepository memory,
                                         com.toonlira.translationgateway.application.port.LexiconPort lexicons) {
        this.chapters = new ChapterMemoryService(memory, lexicons, translation, clock,
            java.time.Duration.ofSeconds(properties.getDisclosure().getResultRetentionSeconds()));
        this.persistence = persistence;
        this.storage = storage;
        this.ocrManifests = ocrManifests;
        this.translationManifests = translationManifests;
        this.translation = translation;
        this.refiner = refiner;
        this.properties = properties;
        this.clock = clock;
        this.lifecycle = lifecycle;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void execute(UUID jobRef) {
        if (properties.getTranslation().getMode() == GatewayProperties.Translation.Mode.DISABLED) return;
        var job = persistence.find(jobRef);
        if (job == null) throw new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false);
        try {
            executeJob(jobRef, job);
        } finally {
            lifecycle.executeForJob(job.id());
        }
    }

    private void executeJob(UUID jobRef, TranslationJobRepository.WorkItem job) {
        if (job.status() == JobStatus.CANCEL_PENDING) {
            persistence.claim(jobRef, Instant.now(clock));
            return;
        }
        if (job.status() != JobStatus.TRANSLATING) return;

        TranslationRequest request;
        TranslationValidator validator;
        try {
            requireOriginal(job);
            validator = new TranslationValidator(enabledPairs());
            var pair = new LanguagePair(job.sourceLanguage(), job.targetLanguage());
            validator.validateRequest(new TranslationRequest(job.jobRef(), pair, List.of()));
            request = readRequest(job, pair);
            validator.validateRequest(request);
        } catch (TranslationValidationException error) {
            persistence.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_INVALID_REQUEST, Instant.now(clock));
            return;
        } catch (GatewayException error) {
            var code = error.code() == GatewayErrorCode.TRANSLATION_INVALID_REQUEST
                || error.code() == GatewayErrorCode.OCR_INVALID_RESPONSE
                ? GatewayErrorCode.TRANSLATION_INVALID_REQUEST : GatewayErrorCode.TRANSLATION_UNAVAILABLE;
            persistence.failUnclaimed(job.id(), code, Instant.now(clock));
            return;
        } catch (RuntimeException | IOException error) {
            persistence.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_UNAVAILABLE, Instant.now(clock));
            return;
        }

        if (persistence.claim(jobRef, Instant.now(clock)) != TranslationJobRepository.Claim.STARTED) return;
        processClaimed(job, request, validator);
    }

    private TranslationRequest readRequest(TranslationJobRepository.WorkItem job, LanguagePair pair) throws IOException {
        if (job.ocrObjectKey() == null || job.ocrSha256() == null) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_REQUEST, 422, false);
        }
        byte[] bytes;
        try (var input = storage.open(job.ocrObjectKey())) {
            bytes = input.readNBytes(OcrLimits.MAX_MANIFEST_BYTES + 1);
        }
        if (bytes.length > OcrLimits.MAX_MANIFEST_BYTES || !MessageDigest.isEqual(
            sha256(bytes).getBytes(StandardCharsets.US_ASCII),
            job.ocrSha256().getBytes(StandardCharsets.US_ASCII))) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_REQUEST, 422, false);
        }
        var manifest = ocrManifests.decode(bytes);
        if (!job.jobRef().equals(manifest.jobRef()) || !pair.source().equals(manifest.sourceLanguage())) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_REQUEST, 422, false);
        }
        // The detector's class of each region (balloon, free text, none), when the layout artifact describes this page.
        var kinds = LayoutHints.read(storage, job.layoutObjectKey(), job.layoutSha256(), job.imageSha256(), job.ocrSha256()).kinds();
        return new TranslationRequest(job.jobRef(), pair, manifest.regions().stream()
            .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText(),
                kinds.get(region.id()))).toList());
    }

    private void processClaimed(TranslationJobRepository.WorkItem job, TranslationRequest request,
                                TranslationValidator validator) {
        Path manifestFile = null;
        String objectKey = null;
        String outputHash = null;
        try {
            requireOriginal(job);
            // A word split one character per balloon (「あ」「ら」) is translated, and reviewed, as one segment.
            var fragments = FragmentJoiner.of(request);
            var response = request.regions().isEmpty()
                ? new TranslationResponse(List.of())
                : fragments.expand(translatePage(job, fragments.request()));
            requireOriginal(job);
            var result = validator.validateResponse(request, response);
            var encoded = translationManifests.encode(result, job.ocrSha256());
            outputHash = encoded.sha256();
            manifestFile = Files.createTempFile("translation-manifest-", ".json");
            Files.write(manifestFile, encoded.bytes());
            objectKey = "private/translation/" + job.id() + "/" + UUID.randomUUID() + ".json";
            storage.store(objectKey, manifestFile, "application/json", outputHash, Instant.now(clock));
            if (!persistence.complete(job.id(), objectKey, outputHash, Instant.now(clock))) {
                deleteBestEffort(objectKey);
            }
        } catch (RuntimeException | IOException error) {
            LOG.warn("translation failed: {}", FailureDiagnostics.describe(error));
            var current = findBestEffort(job.jobRef());
            // A later transition can occur before the commit acknowledgement is
            // observed. The persisted key/hash, not the current job status, prove ownership.
            boolean committed = current != null
                && objectKey != null && objectKey.equals(current.translationObjectKey())
                && outputHash.equals(current.translationSha256());
            if (!committed && current != null) {
                var code = error instanceof TranslationValidationException
                    || error instanceof GatewayException gateway
                    && gateway.code() == GatewayErrorCode.TRANSLATION_INVALID_RESPONSE
                    ? GatewayErrorCode.TRANSLATION_INVALID_RESPONSE
                    : error instanceof GatewayException gateway
                        && gateway.code() == GatewayErrorCode.TRANSLATION_INVALID_REQUEST
                        ? GatewayErrorCode.TRANSLATION_INVALID_REQUEST : GatewayErrorCode.TRANSLATION_UNAVAILABLE;
                try {
                    // A plain snapshot may precede an unresolved commit; the job lock settles its outcome first.
                    persistence.fail(job.id(), code, Instant.now(clock));
                    current = persistence.find(job.jobRef());
                    committed = current != null && objectKey != null && objectKey.equals(current.translationObjectKey())
                        && outputHash.equals(current.translationSha256());
                } catch (RuntimeException uncertain) { current = null; }
            }
            if (objectKey != null && current != null && !committed) deleteBestEffort(objectKey);
        } finally {
            if (manifestFile != null) {
                try { Files.deleteIfExists(manifestFile); } catch (IOException ignored) { }
            }
        }
    }

    /**
     * The optional language review runs on the joined segments, before the synthetic follower ellipses exist, so it
     * can neither rewrite them nor split the joined word again. Any failure (timeout, quota, a reply that is not a
     * review of this page) keeps the machine translation: the layer can improve a page, never fail it.
     */
    /**
     * Machine translation of the page keeping the terms its chapter already decided, then the optional review, which
     * keeps them too and reports the page's names for the chapter's next pages. Without a chapter: as always.
     */
    private TranslationResponse translatePage(TranslationJobRepository.WorkItem job, TranslationRequest request) {
        var decided = chapters.decide(job, request);
        boolean onPage = decided.keySet().stream().anyMatch(term -> request.regions().stream()
            .anyMatch(region -> region.sourceText().toUpperCase(java.util.Locale.ROOT).contains(term.toUpperCase(java.util.Locale.ROOT))));
        var machine = onPage ? translation.translate(request, decided) : translation.translate(request);
        if (job.contextRef() == null || refiner == TranslationRefinerPort.NONE) return refineOrKeep(request, machine);
        try {
            var review = refiner.refine(request, machine, decided);
            if (review != null && review.response() != null && sameRegions(machine, review.response())) {
                chapters.learn(job, request.pair(), review.names());
                return review.response();
            }
            LOG.warn("translation refine discarded: regions={} reply did not match the page", request.regions().size());
        } catch (RuntimeException error) {
            LOG.warn("translation refine skipped: regions={} cause={}", request.regions().size(), error.getClass().getSimpleName());
        }
        return machine;
    }

    private TranslationResponse refineOrKeep(TranslationRequest request, TranslationResponse translated) {
        if (refiner == TranslationRefinerPort.NONE) return translated;
        try {
            var refined = refiner.refine(request, translated);
            if (refined != null && sameRegions(translated, refined)) return refined;
            LOG.warn("translation refine discarded: regions={} reply did not match the page", request.regions().size());
        } catch (RuntimeException error) {
            LOG.warn("translation refine skipped: regions={} cause={}", request.regions().size(), error.getClass().getSimpleName());
        }
        return translated;
    }

    private static boolean sameRegions(TranslationResponse translated, TranslationResponse refined) {
        if (refined.regions().size() != translated.regions().size()) return false;
        for (int index = 0; index < translated.regions().size(); index++) {
            var region = refined.regions().get(index);
            if (!translated.regions().get(index).id().equals(region.id()) || region.translatedText() == null
                || region.translatedText().isBlank()
                || region.translatedText().length() > TranslationLimits.MAX_TRANSLATED_PER_REGION) {
                return false;
            }
        }
        return true;
    }

    private Set<LanguagePair> enabledPairs() {
        return ConfiguredTranslationPairs.parse(properties.getTranslation().getEnabledPairs());
    }

    private void requireOriginal(TranslationJobRepository.WorkItem job) {
        if (!persistence.originalAvailable(job.id(), clock.instant())) throw new GatewayException(GatewayErrorCode.TRANSLATION_UNAVAILABLE, 503, false);
    }

    private TranslationJobRepository.WorkItem findBestEffort(UUID jobRef) {
        try { return persistence.find(jobRef); } catch (RuntimeException ignored) { return null; }
    }

    private void deleteBestEffort(String key) {
        try { storage.delete(key); } catch (RuntimeException ignored) { }
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 unavailable");
        }
    }
}
