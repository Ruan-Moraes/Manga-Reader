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
