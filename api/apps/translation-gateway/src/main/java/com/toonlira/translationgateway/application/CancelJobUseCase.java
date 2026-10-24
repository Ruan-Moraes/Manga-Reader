package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.domain.ProcessingJob;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CancelJobUseCase {
    private final GatewayRepository repository;
    private final Clock clock;
    private final LifecycleCleanupRepository cleanup;
    private final LifecycleCleanupAfterCommit afterCommit;

    public CancelJobUseCase(GatewayRepository repository, Clock clock, LifecycleCleanupRepository cleanup,
                            LifecycleCleanupAfterCommit afterCommit) {
        this.repository = repository;
        this.clock = clock;
        this.cleanup = cleanup;
        this.afterCommit = afterCommit;
    }

    @Transactional
    public ProcessingJob execute(UUID installationId, UUID jobRef) {
        var now = Instant.now(clock);
        var job = repository.cancel(installationId, jobRef, now);
        cleanup.enqueueEligible(job.id(), now);
        if (job.status().terminal()) afterCommit.schedule(job.id());
        return job;
    }
}
