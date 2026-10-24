package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TranslationPersistenceUseCase {
    private final TranslationJobRepository repository;
    private final LifecycleCleanupRepository cleanup;

    public TranslationPersistenceUseCase(TranslationJobRepository repository, LifecycleCleanupRepository cleanup) {
        this.repository = repository;
        this.cleanup = cleanup;
    }

    @Transactional(readOnly = true)
    public TranslationJobRepository.WorkItem find(UUID jobRef) { return repository.find(jobRef).orElse(null); }

    @Transactional(readOnly = true)
    public boolean originalAvailable(UUID jobId, Instant now) { return repository.originalAvailable(jobId, now); }

    @Transactional
    public TranslationJobRepository.Claim claim(UUID jobRef, Instant now) {
        var result = repository.claim(jobRef, now);
        if (result == TranslationJobRepository.Claim.CANCELLED) {
            repository.find(jobRef).ifPresent(job -> cleanup.enqueueEligible(job.id(), now));
        }
        return result;
    }

    @Transactional
    public boolean complete(UUID jobId, String key, String hash, Instant now) {
        var completed = repository.complete(jobId, key, hash, now);
        cleanup.enqueueEligible(jobId, now);
        return completed;
    }

    @Transactional
    public void failUnclaimed(UUID jobId, GatewayErrorCode code, Instant now) {
        repository.failUnclaimed(jobId, code, now);
        cleanup.enqueueEligible(jobId, now);
    }

    @Transactional
    public void fail(UUID jobId, GatewayErrorCode code, Instant now) {
        repository.fail(jobId, code, now);
        cleanup.enqueueEligible(jobId, now);
    }

    @Transactional
    public int failStale(Instant cutoff, Instant now, int limit) { return repository.failStale(cutoff, now, limit); }
}
