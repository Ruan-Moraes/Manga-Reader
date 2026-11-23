package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.LifecycleCleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Only the current job can be claimed. The parent owns timestamps and CAS leases. */
final class RenderingSessionCleanupPersistence extends LifecycleCleanupPersistenceUseCase {
    RenderingSessionCleanupPersistence() { super(null); }
    @Override public LifecycleCleanupRepository.CleanupClaim claimForJob(UUID id, Instant now, Instant until) {
        return RenderingSessionPersistence.call("CLEANUP_CLAIM", null, null).cleanup();
    }
    @Override public boolean complete(UUID id, Instant lease, Instant now) {
        return RenderingSessionPersistence.call("CLEANUP_COMPLETE", null, lease).accepted();
    }
    @Override public void reschedule(UUID id, Instant lease, Instant next) {
        RenderingSessionPersistence.call("CLEANUP_RESCHEDULE", null, lease);
    }
    @Override public int reconcile(int limit, Instant now) { throw new UnsupportedOperationException(); }
    @Override public List<LifecycleCleanupRepository.CleanupClaim> claim(int limit, Instant now, Instant until) {
        throw new UnsupportedOperationException();
    }
}
