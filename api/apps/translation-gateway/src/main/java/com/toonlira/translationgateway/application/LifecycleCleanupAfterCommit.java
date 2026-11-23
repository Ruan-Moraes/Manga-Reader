package com.toonlira.translationgateway.application;

import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** An optional immediate attempt; the transactionally persisted intent remains authoritative. */
@Component
public class LifecycleCleanupAfterCommit {
    private final CleanupLifecycleObjectsUseCase cleanup;

    public LifecycleCleanupAfterCommit(CleanupLifecycleObjectsUseCase cleanup) {
        this.cleanup = cleanup;
    }

    public void schedule(UUID jobId) {
        if (jobId == null) throw new IllegalArgumentException("Invalid lifecycle cleanup job");
        if (!TransactionSynchronizationManager.isActualTransactionActive()
            || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Lifecycle cleanup requires a transaction");
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    // The injected proxy suspends the completed transaction before opening its own claims.
                    cleanup.executeForJob(jobId);
                } catch (RuntimeException unavailable) {
                    // Never turn an accepted commit into a retry; the durable intent remains recoverable.
                }
            }
        });
    }
}
