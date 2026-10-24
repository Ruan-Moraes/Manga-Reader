package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CleanupAcknowledgedResultsUseCase {
    private static final int BATCH_SIZE = 100;
    private static final Duration LEASE = Duration.ofMinutes(5);
    private static final Duration RETRY_DELAY = Duration.ofMinutes(1);
    private final ResultAcknowledgementPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final Clock clock;

    public CleanupAcknowledgedResultsUseCase(ResultAcknowledgementPersistenceUseCase persistence,
                                             ObjectStoragePort storage, Clock clock) {
        this.persistence = persistence;
        this.storage = storage;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Result execute() {
        var now = Instant.now(clock);
        int completed = 0;
        int deferred = 0;
        for (var claim : persistence.claim(BATCH_SIZE, now, now.plus(LEASE))) {
            try {
                if (!ClaimedObjectCleanup.deleteAll(storage, claim.objectKeys())) {
                    deferred++;
                    reschedule(claim);
                    continue;
                }
                if (persistence.complete(claim.jobId(), claim.leaseUntil(), Instant.now(clock))) completed++;
                else deferred++;
            } catch (RuntimeException error) {
                deferred++;
                reschedule(claim);
            }
        }
        return new Result(completed, deferred);
    }

    private void reschedule(ResultAcknowledgementRepository.CleanupClaim claim) {
        try {
            persistence.reschedule(claim.jobId(), claim.leaseUntil(), Instant.now(clock).plus(RETRY_DELAY));
        } catch (RuntimeException ignored) {
            // The persisted lease remains reclaimable even if this acknowledgement is lost.
        }
    }

    public record Result(int completed, int deferred) { }
}
