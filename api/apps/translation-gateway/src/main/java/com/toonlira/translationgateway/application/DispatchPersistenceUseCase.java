package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DispatchPersistenceUseCase {
    private final GatewayRepository repository;
    private final LifecycleCleanupRepository cleanup;
    private final LifecycleCleanupAfterCommit afterCommit;

    public DispatchPersistenceUseCase(GatewayRepository repository, LifecycleCleanupRepository cleanup,
                                      LifecycleCleanupAfterCommit afterCommit) {
        this.repository = repository;
        this.cleanup = cleanup;
        this.afterCommit = afterCommit;
    }

    @Transactional
    public List<GatewayRepository.DispatchClaim> claim(int limit, Instant now, Instant leaseUntil) {
        return repository.claimDispatches(limit, now, leaseUntil);
    }

    @Transactional
    public boolean complete(UUID jobId, int attempt, Instant now) {
        return repository.markDispatched(jobId, attempt, now);
    }

    @Transactional
    public boolean fail(UUID jobId, int attempt, int maxAttempts, Instant now) {
        long seconds = Math.min(300, 1L << Math.min(20, Math.max(0, attempt - 1)));
        boolean changed = repository.rescheduleDispatch(jobId, attempt, now.plusSeconds(seconds),
            "task-dispatch-failed", attempt >= maxAttempts, now);
        if (changed && attempt >= maxAttempts) {
            cleanup.enqueueEligible(jobId, now);
            afterCommit.schedule(jobId);
        }
        return changed;
    }
}
