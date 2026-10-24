package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RenderingPersistenceUseCase {
    private final RenderingJobRepository repository;
    private final LifecycleCleanupRepository cleanup;

    public RenderingPersistenceUseCase(RenderingJobRepository repository, LifecycleCleanupRepository cleanup) {
        this.repository = repository;
        this.cleanup = cleanup;
    }

    @Transactional(readOnly = true)
    public RenderingJobRepository.WorkItem find(UUID jobRef) { return repository.find(jobRef).orElse(null); }

    @Transactional(readOnly = true)
    public boolean originalAvailable(UUID jobId, Instant now) { return repository.originalAvailable(jobId, now); }

    @Transactional
    public RenderingJobRepository.Claim claim(UUID jobRef, Instant now) {
        var result = repository.claim(jobRef, now);
        if (result == RenderingJobRepository.Claim.CANCELLED) {
            repository.find(jobRef).ifPresent(job -> cleanup.enqueueEligible(job.id(), now));
        }
        return result;
    }

    @Transactional
    public boolean complete(UUID jobId, RenderingJobRepository.Artifacts artifacts, Instant now) {
        var completed = repository.complete(jobId, artifacts, now);
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
    public List<String> failStale(Instant cutoff, Instant now, int limit) {
        if (limit < 1 || limit > 100) throw new IllegalArgumentException("Invalid rendering cleanup limit");
        return repository.failStale(cutoff, now, limit);
    }
}
