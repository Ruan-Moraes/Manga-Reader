package com.mangareader.translationgateway.application;

import com.mangareader.translationgateway.application.port.GatewayRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DispatchPersistenceUseCase {
    private final GatewayRepository repository;

    public DispatchPersistenceUseCase(GatewayRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public List<GatewayRepository.DispatchClaim> claim(int limit, Instant now, Instant leaseUntil) {
        return repository.claimDispatches(limit, now, leaseUntil);
    }

    @Transactional
    public void complete(UUID jobId, Instant now) {
        repository.markDispatched(jobId, now);
    }

    @Transactional
    public void fail(UUID jobId, int attempt, int maxAttempts, Instant now) {
        long seconds = Math.min(300, 1L << Math.min(20, Math.max(0, attempt - 1)));
        repository.rescheduleDispatch(jobId, now.plusSeconds(seconds), "task-dispatch-failed", attempt >= maxAttempts, now);
    }
}
