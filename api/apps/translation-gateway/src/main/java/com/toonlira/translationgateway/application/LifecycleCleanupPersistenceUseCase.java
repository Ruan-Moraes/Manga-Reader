package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LifecycleCleanupPersistenceUseCase {
    private final LifecycleCleanupRepository repository;

    public LifecycleCleanupPersistenceUseCase(LifecycleCleanupRepository repository) { this.repository = repository; }

    @Transactional
    public int reconcile(int limit, Instant now) { return repository.reconcile(limit, now); }

    @Transactional
    public List<LifecycleCleanupRepository.CleanupClaim> claim(int limit, Instant now, Instant leaseUntil) {
        return repository.claim(limit, now, leaseUntil);
    }

    @Transactional
    public LifecycleCleanupRepository.CleanupClaim claimForJob(UUID jobId, Instant now, Instant leaseUntil) {
        repository.enqueueEligible(jobId, now);
        return repository.claimForJob(jobId, now, leaseUntil).orElse(null);
    }

    @Transactional
    public boolean complete(UUID jobId, Instant leaseUntil, Instant now) {
        return repository.complete(jobId, leaseUntil, now);
    }

    @Transactional
    public void reschedule(UUID jobId, Instant leaseUntil, Instant nextAttemptAt) {
        repository.reschedule(jobId, leaseUntil, nextAttemptAt);
    }
}
