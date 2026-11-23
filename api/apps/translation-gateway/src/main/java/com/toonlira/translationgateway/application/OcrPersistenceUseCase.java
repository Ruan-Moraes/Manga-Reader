package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.layout.LayoutOutcome;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OcrPersistenceUseCase {
    private final OcrJobRepository repository;
    private final LifecycleCleanupRepository cleanup;

    public OcrPersistenceUseCase(OcrJobRepository repository, LifecycleCleanupRepository cleanup) {
        this.repository = repository;
        this.cleanup = cleanup;
    }

    @Transactional(readOnly = true)
    public OcrJobRepository.WorkItem find(UUID jobRef) { return repository.find(jobRef).orElse(null); }

    @Transactional(readOnly = true)
    public OcrJobRepository.OutputArtifact findOutput(UUID jobId) { return repository.findOutput(jobId).orElse(null); }

    @Transactional(readOnly = true)
    public boolean originalAvailable(UUID jobId, Instant now) { return repository.originalAvailable(jobId, now); }

    @Transactional
    public OcrJobRepository.Claim claim(UUID jobRef, Instant now) {
        var result = repository.claim(jobRef, now);
        if (result == OcrJobRepository.Claim.CANCELLED) {
            repository.find(jobRef).ifPresent(job -> cleanup.enqueueEligible(job.id(), now));
        }
        return result;
    }

    @Transactional
    public boolean complete(UUID jobId, String objectKey, String sha256, Instant now) {
        var completed = repository.complete(jobId, objectKey, sha256, now);
        cleanup.enqueueEligible(jobId, now);
        return completed;
    }

    @Transactional
    public boolean completeWithLayout(UUID jobId, String objectKey, String sha256, Instant now, LayoutOutcome layout) {
        var completed = repository.completeWithLayout(jobId, objectKey, sha256, now, layout);
        cleanup.enqueueEligible(jobId, now);
        return completed;
    }

    @Transactional
    public void fail(UUID jobId, GatewayErrorCode errorCode, Instant now) {
        repository.fail(jobId, errorCode, now);
        cleanup.enqueueEligible(jobId, now);
    }

    @Transactional
    public void failUnclaimed(UUID jobId, GatewayErrorCode errorCode, Instant now) {
        repository.failUnclaimed(jobId, errorCode, now);
        cleanup.enqueueEligible(jobId, now);
    }

    @Transactional
    public List<String> failStale(Instant cutoff, Instant now, int limit) {
        return repository.failStale(cutoff, now, limit);
    }
}
