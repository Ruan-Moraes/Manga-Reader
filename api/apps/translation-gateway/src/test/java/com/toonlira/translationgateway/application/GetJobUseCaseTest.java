package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.domain.DispatchStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class GetJobUseCaseTest {
    private final GatewayRepository repository = mock(GatewayRepository.class);
    private final ResultExpirationUseCase expiration = mock(ResultExpirationUseCase.class);
    private final UUID owner = UUID.randomUUID();
    private final UUID ref = UUID.randomUUID();
    private final UUID key = UUID.randomUUID();
    private final GetJobUseCase useCase = new GetJobUseCase(repository, expiration);

    @Test
    void expiresBeforeReadingByRef() {
        var expired = job(JobStatus.RESULT_EXPIRED);
        when(repository.findByJobRef(owner, ref)).thenReturn(Optional.of(expired));
        assertThat(useCase.byRef(owner, ref)).isEqualTo(expired);
        var ordered = inOrder(expiration, repository);
        ordered.verify(expiration).expire(owner, ref);
        ordered.verify(repository).findByJobRef(owner, ref);
    }

    @Test
    void rereadsReadyIdempotencyAfterAtomicExpiration() {
        var expired = job(JobStatus.RESULT_EXPIRED);
        when(repository.findByIdempotency(owner, key)).thenReturn(Optional.of(job(JobStatus.READY)));
        when(repository.findByJobRef(owner, ref)).thenReturn(Optional.of(expired));
        assertThat(useCase.byIdempotency(owner, key)).isEqualTo(expired);
        verify(expiration).expire(owner, ref);
    }

    @Test
    void doesNotExpireUnfinishedIdempotentJob() {
        var queued = job(JobStatus.QUEUED);
        when(repository.findByIdempotency(owner, key)).thenReturn(Optional.of(queued));
        assertThat(useCase.byIdempotency(owner, key)).isEqualTo(queued);
        verify(expiration, never()).expire(owner, ref);
    }

    @Test
    void missingJobIsSanitizedWithoutLeakingIdentity() {
        when(repository.findByIdempotency(owner, key)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> useCase.byIdempotency(owner, key))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.JOB_NOT_FOUND);
                assertThat(error.getMessage()).doesNotContain(owner.toString(), key.toString());
                assertThat(error.getCause()).isNull();
            });
    }

    private ProcessingJob job(JobStatus status) {
        return new ProcessingJob(UUID.randomUUID(), ref, owner, key, UUID.randomUUID(), "a".repeat(64),
            status, DispatchStatus.DISPATCHED, null, Instant.parse("2026-10-04T12:00:00Z"));
    }
}
