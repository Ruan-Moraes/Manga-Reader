package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.domain.DispatchStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.Installation;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReserveJobUseCaseTest {
    @Mock private GatewayRepository repository;
    private ReserveJobUseCase useCase;
    private UUID installationId;
    private GatewayRepository.NewJob candidate;

    @BeforeEach
    void setUp() {
        useCase = new ReserveJobUseCase(repository, new GatewayProperties());
        installationId = UUID.randomUUID();
        var now = Instant.parse("2026-09-02T12:00:00Z");
        candidate = new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), installationId, UUID.randomUUID(), UUID.randomUUID(),
            "privacy-2026-09", "ja", "pt-BR", "image/png", 32, 1, 1, "private/originals/x", "a".repeat(64), "b".repeat(64),
            now, now.plusSeconds(604800));
        when(repository.findInstallationForUpdate(installationId))
            .thenReturn(Optional.of(new Installation(installationId, "hash", "ACTIVE", now)));
    }

    @Test
    void shouldReturnExistingMatchingReplayBeforeQuota() {
        var existing = job(candidate.requestFingerprint());
        when(repository.findByIdempotency(installationId, candidate.idempotencyKey())).thenReturn(Optional.of(existing));

        var result = useCase.execute(candidate);

        assertThat(result.created()).isFalse();
        assertThat(result.job()).isSameAs(existing);
    }

    @Test
    void shouldRejectSameKeyWithDifferentFingerprint() {
        when(repository.findByIdempotency(installationId, candidate.idempotencyKey())).thenReturn(Optional.of(job("c".repeat(64))));

        assertThatThrownBy(() -> useCase.execute(candidate)).isInstanceOfSatisfying(GatewayException.class,
            error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.JOB_STATE_CONFLICT));
    }

    @Test
    void shouldLockAndApplyBothQuotasBeforeInsert() {
        when(repository.findByIdempotency(installationId, candidate.idempotencyKey())).thenReturn(Optional.empty());
        when(repository.countInstallationJobs(any(), any(), any())).thenReturn(19L);
        when(repository.countGlobalJobs(any(), any())).thenReturn(99L);
        var inserted = job(candidate.requestFingerprint());
        when(repository.insertJob(candidate)).thenReturn(inserted);

        assertThat(useCase.execute(candidate).created()).isTrue();
        verify(repository).acquireGlobalQuotaLock(20698L);
    }

    @Test
    void shouldRejectWhenInstallationQuotaIsExhausted() {
        when(repository.findByIdempotency(installationId, candidate.idempotencyKey())).thenReturn(Optional.empty());
        when(repository.countInstallationJobs(any(), any(), any())).thenReturn(20L);

        assertThatThrownBy(() -> useCase.execute(candidate)).isInstanceOfSatisfying(GatewayException.class,
            error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.QUOTA_EXCEEDED));
    }

    private ProcessingJob job(String fingerprint) {
        return new ProcessingJob(candidate.id(), candidate.jobRef(), installationId, candidate.idempotencyKey(), candidate.attemptRef(), fingerprint,
            JobStatus.QUEUED, DispatchStatus.PENDING, null, candidate.now());
    }
}
