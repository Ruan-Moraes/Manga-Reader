package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CleanupLifecycleObjectsUseCase {
    private static final int BATCH_SIZE = 100;
    private static final Duration LEASE = Duration.ofMinutes(5);
    private static final Duration RETRY_DELAY = Duration.ofMinutes(1);
    private final LifecycleCleanupPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final Clock clock;

    public CleanupLifecycleObjectsUseCase(LifecycleCleanupPersistenceUseCase persistence,
                                          ObjectStoragePort storage, Clock clock) {
        this.persistence = persistence;
        this.storage = storage;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Result execute() {
        var now = Instant.now(clock);
        persistence.reconcile(BATCH_SIZE, now);
        return clean(persistence.claim(BATCH_SIZE, now, now.plus(LEASE)));
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Result executeForJob(UUID jobId) {
        try {
            var now = Instant.now(clock);
            var claim = persistence.claimForJob(jobId, now, now.plus(LEASE));
            return claim == null ? new Result(0, 0) : clean(List.of(claim));
        } catch (RuntimeException unavailable) {
            // Unknown commit/state must not delete objects or replace the worker outcome.
            return new Result(0, 1);
        }
    }

    private Result clean(List<LifecycleCleanupRepository.CleanupClaim> claims) {
        int completed = 0;
        int deferred = 0;
        for (var claim : claims) {
            try {
                if (!ClaimedObjectCleanup.deleteAll(storage, claim.objectKeys())) {
                    deferred++;
                    reschedule(claim);
                    continue;
                }
                if (persistence.complete(claim.jobId(), claim.leaseUntil(), Instant.now(clock))) completed++;
                else deferred++;
            } catch (RuntimeException failure) {
                deferred++;
                reschedule(claim);
            }
        }
        return new Result(completed, deferred);
    }

    private void reschedule(LifecycleCleanupRepository.CleanupClaim claim) {
        try {
            persistence.reschedule(claim.jobId(), claim.leaseUntil(), Instant.now(clock).plus(RETRY_DELAY));
        } catch (RuntimeException ignored) {
            // A lost acknowledgement leaves the persisted lease reclaimable.
        }
    }

    public record Result(int completed, int deferred) { }
}
