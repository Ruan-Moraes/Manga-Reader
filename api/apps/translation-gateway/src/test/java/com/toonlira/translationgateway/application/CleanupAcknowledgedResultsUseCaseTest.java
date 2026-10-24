package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CleanupAcknowledgedResultsUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-10-03T12:00:00Z");
    private final ResultAcknowledgementPersistenceUseCase persistence = mock(ResultAcknowledgementPersistenceUseCase.class);
    private final ObjectStoragePort storage = mock(ObjectStoragePort.class);

    @Test
    void deletesOnlyClaimedObjectsThenCompletesTheLease() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        when(persistence.complete(claim.jobId(), claim.leaseUntil(), NOW)).thenReturn(true);
        assertThat(cleanup().execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(1, 0));
        verify(storage).delete("private/originals/fixture");
        verify(storage).delete("private/translation/fixture.json");
        verify(persistence).complete(claim.jobId(), claim.leaseUntil(), NOW);
        verify(persistence, never()).reschedule(any(), any(), any());
    }

    @Test
    void storageFailureKeepsTheRequestPendingWithoutCompletingIt() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        doThrow(new IllegalStateException("synthetic private object response")).when(storage).delete("private/originals/fixture");
        assertThat(cleanup().execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(0, 1));
        verify(persistence, never()).complete(any(), any(), any());
        verify(persistence).reschedule(claim.jobId(), claim.leaseUntil(), NOW.plusSeconds(60));
        verify(storage).delete("private/translation/fixture.json");
    }

    @Test
    void ambiguousCompletionIsDeferredWithoutAnotherStorageAttempt() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        when(persistence.complete(claim.jobId(), claim.leaseUntil(), NOW)).thenThrow(new IllegalStateException("synthetic commit error"));
        assertThat(cleanup().execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(0, 1));
        verify(persistence).reschedule(claim.jobId(), claim.leaseUntil(), NOW.plusSeconds(60));
        verify(storage).delete("private/originals/fixture");
        verify(storage).delete("private/translation/fixture.json");
    }

    @Test
    void staleLeaseCannotClaimCompletion() {
        var claim = claim();
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(claim));
        when(persistence.complete(claim.jobId(), claim.leaseUntil(), NOW)).thenReturn(false);
        assertThat(cleanup().execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(0, 1));
    }

    @Test
    void failureOfOneClaimDoesNotSkipTheFollowingJob() {
        var first = claim();
        var second = new ResultAcknowledgementRepository.CleanupClaim(UUID.randomUUID(), NOW.plusSeconds(300), List.of("private/ocr/second"));
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of(first, second));
        doThrow(new IllegalStateException("synthetic storage error")).when(storage).delete("private/originals/fixture");
        when(persistence.complete(second.jobId(), second.leaseUntil(), NOW)).thenReturn(true);
        assertThat(cleanup().execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(1, 1));
        verify(storage).delete("private/ocr/second");
    }

    @Test
    void missingClaimsDoNotAccessStorage() {
        when(persistence.claim(100, NOW, NOW.plusSeconds(300))).thenReturn(List.of());
        assertThat(cleanup().execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(0, 0));
        verify(storage, never()).delete(any());
    }

    private CleanupAcknowledgedResultsUseCase cleanup() {
        return new CleanupAcknowledgedResultsUseCase(persistence, storage, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private ResultAcknowledgementRepository.CleanupClaim claim() {
        return new ResultAcknowledgementRepository.CleanupClaim(UUID.randomUUID(), NOW.plusSeconds(300),
            List.of("private/originals/fixture", "private/translation/fixture.json"));
    }
}
