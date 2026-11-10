package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResultAcknowledgementPersistenceUseCase {
    private final ResultAcknowledgementRepository repository;

    public ResultAcknowledgementPersistenceUseCase(ResultAcknowledgementRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void request(UUID installationId, UUID jobRef, Instant now) {
        repository.request(installationId, jobRef, now);
    }

    @Transactional
    public List<ResultAcknowledgementRepository.CleanupClaim> claimForJob(UUID installationId, UUID jobRef,
                                                                           Instant now, Instant leaseUntil) {
        return repository.claimForJob(installationId, jobRef, now, leaseUntil);
    }

    @Transactional(readOnly = true)
    public boolean completedForJob(UUID installationId, UUID jobRef) {
        return repository.completedForJob(installationId, jobRef);
    }

    @Transactional
    public List<ResultAcknowledgementRepository.CleanupClaim> claim(int limit, Instant now, Instant leaseUntil) {
        return repository.claim(limit, now, leaseUntil);
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
