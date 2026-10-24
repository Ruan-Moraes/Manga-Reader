package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;

import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CleanupLifecycleObjectsUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-10-04T12:00:00Z");
    private final LifecycleCleanupPersistenceUseCase persistence = mock(LifecycleCleanupPersistenceUseCase.class);
    private final ObjectStoragePort storage = mock(ObjectStoragePort.class);
    private final CleanupLifecycleObjectsUseCase cleanup = new CleanupLifecycleObjectsUseCase(
        persistence, storage, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void reconcilesThenDeletesOnlyClaimedReferencesBeforeConfirming() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        when(persistence.complete(claim.jobId(), claim.leaseUntil(), NOW)).thenReturn(true);
        assertThat(cleanup.execute()).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(1, 0));
        var ordered = inOrder(persistence, storage);
        ordered.verify(persistence).reconcile(100, NOW);
        ordered.verify(persistence).claim(100, NOW, claim.leaseUntil());
        ordered.verify(storage).delete("private/test-original");
        ordered.verify(storage).delete("private/test-manifest");
        ordered.verify(persistence).complete(claim.jobId(), claim.leaseUntil(), NOW);
        verifyNoMoreInteractions(storage);
    }

    @Test
    void deleteFailureIsDeferredWithoutLeakingContentOrConfirming() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        doThrow(new IllegalStateException("private/sensitive raw provider text")).when(storage).delete("private/test-original");
        assertThat(cleanup.execute()).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(0, 1));
        verify(storage).delete("private/test-manifest");
        verify(persistence).reschedule(claim.jobId(), claim.leaseUntil(), NOW.plusSeconds(60));
        verify(persistence, never()).complete(any(), any(), any());
        assertThat(claim.toString()).doesNotContain("private", claim.jobId().toString());
    }

    @Test
    void lostCompletionAndRescheduleLeaveLeaseForRecovery() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        when(persistence.complete(claim.jobId(), claim.leaseUntil(), NOW)).thenThrow(new IllegalStateException("commit unknown"));
        doThrow(new IllegalStateException("database unavailable")).when(persistence)
            .reschedule(claim.jobId(), claim.leaseUntil(), NOW.plusSeconds(60));
        assertThat(cleanup.execute()).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(0, 1));
    }

    @Test
    void staleCompletionIsNotReportedAsSuccessful() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        assertThat(cleanup.execute()).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(0, 1));
    }

    @Test
    void immediateCleanupIsRestrictedToOneJobWithoutGlobalReconciliation() {
        var claim = claim();
        when(persistence.claimForJob(claim.jobId(), NOW, claim.leaseUntil())).thenReturn(claim);
        when(persistence.complete(claim.jobId(), claim.leaseUntil(), NOW)).thenReturn(true);
        assertThat(cleanup.executeForJob(claim.jobId())).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(1, 0));
        verify(persistence, never()).reconcile(anyInt(), any());
        verify(persistence, never()).claim(anyInt(), any(), any());
        verify(storage).delete("private/test-original");
        verify(storage).delete("private/test-manifest");
    }

    @Test
    void activeOrLeasedJobDoesNotDeleteAnyObject() {
        assertThat(cleanup.executeForJob(UUID.randomUUID())).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(0, 0));
        verifyNoInteractions(storage);
    }

    @Test
    void immediateDatabaseFailureIsDeferredWithoutChangingWorkerOutcomeOrOpeningStorage() {
        var jobId = UUID.randomUUID();
        when(persistence.claimForJob(jobId, NOW, NOW.plusSeconds(300)))
            .thenThrow(new IllegalStateException("sensitive SQL parameters"));
        assertThat(cleanup.executeForJob(jobId)).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(0, 1));
        verifyNoInteractions(storage);
    }

    @Test
    void immediateDeleteFailureReschedulesOnlyTheOwnedJob() {
        var claim = claim();
        when(persistence.claimForJob(claim.jobId(), NOW, claim.leaseUntil())).thenReturn(claim);
        doThrow(new IllegalStateException("private/key")).when(storage).delete("private/test-original");
        assertThat(cleanup.executeForJob(claim.jobId())).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(0, 1));
        verify(persistence).reschedule(claim.jobId(), claim.leaseUntil(), NOW.plusSeconds(60));
        verify(storage).delete("private/test-manifest");
        verify(persistence, never()).complete(any(), any(), any());
    }

    private LifecycleCleanupRepository.CleanupClaim claim() {
        return new LifecycleCleanupRepository.CleanupClaim(UUID.randomUUID(), NOW.plusSeconds(300),
            List.of("private/test-original", "private/test-manifest"));
    }
}
