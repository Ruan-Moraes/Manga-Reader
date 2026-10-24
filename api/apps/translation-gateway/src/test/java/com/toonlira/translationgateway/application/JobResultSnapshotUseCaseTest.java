package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.port.ResultDownloadRepository;
import com.toonlira.translationgateway.domain.DispatchStatus;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.rendering.ReadyResultReference;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JobResultSnapshotUseCaseTest {
    private final GetJobUseCase getJob = mock(GetJobUseCase.class);
    private final ResultDownloadRepository repository = mock(ResultDownloadRepository.class);
    private final JobResultSnapshotUseCase useCase = new JobResultSnapshotUseCase(getJob, repository);
    private final UUID owner = UUID.randomUUID(), ref = UUID.randomUUID(), key = UUID.randomUUID();
    private final Instant now = Instant.parse("2026-10-04T12:00:00Z");

    @Test void completedReadyProjectionIsOwnerScoped() {
        when(getJob.byRef(owner, ref)).thenReturn(job(JobStatus.READY));
        var reference = new ReadyResultReference(1, 2, "private/rendering/image", "a".repeat(64), 1,
            "private/rendering/manifest", "b".repeat(64), now);
        when(repository.findReady(owner, ref)).thenReturn(Optional.of(reference));
        assertThat(useCase.byRef(owner, ref).reference()).isEqualTo(reference);
        verify(repository).findReady(owner, ref);
    }
    @Test void missingProjectionAfterAckRereadsExpiredState() {
        when(getJob.byRef(owner, ref)).thenReturn(job(JobStatus.READY), job(JobStatus.RESULT_EXPIRED));
        when(repository.findReady(owner, ref)).thenReturn(Optional.empty());
        var snapshot = useCase.byRef(owner, ref);
        assertThat(snapshot.job().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(snapshot.reference()).isNull();
    }
    @Test void legacyReadyWithoutArtifactsIsNotAnInventedResult() {
        when(getJob.byRef(owner, ref)).thenReturn(job(JobStatus.READY));
        when(repository.findReady(owner, ref)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> useCase.byRef(owner, ref)).isInstanceOf(GatewayException.class)
            .hasMessage("storage-unavailable").hasNoCause();
    }
    @Test void idempotencyLookupKeepsNonReadyStateAndAvoidsProjection() {
        when(getJob.byIdempotency(owner, key)).thenReturn(job(JobStatus.QUEUED));
        assertThat(useCase.byIdempotency(owner, key).reference()).isNull();
        verifyNoInteractions(repository);
    }
    private ProcessingJob job(JobStatus status) {
        return new ProcessingJob(UUID.randomUUID(), ref, owner, key, UUID.randomUUID(), "0".repeat(64),
            status, DispatchStatus.DISPATCHED, null, now);
    }
}
