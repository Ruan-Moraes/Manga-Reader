package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import com.toonlira.translationgateway.domain.DispatchStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.toonlira.translationgateway.domain.rendering.PrivateDownloadRequest;
import com.toonlira.translationgateway.domain.rendering.ReadyResultReference;
import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class GetJobResultUseCaseTest {
    private final JobResultSnapshotUseCase snapshots = mock(JobResultSnapshotUseCase.class);
    private final PrivateDownloadPort downloads = mock(PrivateDownloadPort.class);
    private final GatewayProperties properties = new GatewayProperties();
    private final Instant now = Instant.parse("2026-10-04T12:00:00Z");
    private final UUID owner = UUID.randomUUID();
    private final UUID jobId = UUID.randomUUID();
    private final UUID ref = UUID.randomUUID();
    private final ReadyResultReference reference = new ReadyResultReference(100, 200,
        "private/rendering/job/image.webp", "a".repeat(64), 1024,
        "private/rendering/job/manifest.json", "b".repeat(64), now);
    private GetJobResultUseCase useCase;

    @BeforeEach void setup() {
        properties.getDisclosure().setResultRetentionSeconds(3600);
        useCase = new GetJobResultUseCase(snapshots, downloads, properties, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test void signsBothArtifactsAndRechecksOwnershipWithoutReorderingMetadata() {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY));
        when(downloads.sign(any())).thenAnswer(call -> download(call.getArgument(0)));
        var result = useCase.byRef(owner, ref);
        assertThat(result.result().image().sha256()).isEqualTo(reference.imageSha256());
        assertThat(result.result().manifest().sha256()).isEqualTo(reference.manifestSha256());
        assertThat(result.result().expiresAt()).isEqualTo(now.plusSeconds(3600));
        assertThat(result.serverTime()).isEqualTo(now);
        verify(snapshots, times(2)).byRef(owner, ref);
        verify(downloads, times(2)).sign(any());
        assertThat(result.toString()).doesNotContain(ref.toString(), "private/", "secret");
    }

    @Test void storedDeadlineCannotBeExtendedByLaterConfiguration() {
        var stored = new ReadyResultReference(100, 200, reference.imageObjectKey(), reference.imageSha256(), 1024,
            reference.manifestObjectKey(), reference.manifestSha256(), now, now.plusSeconds(60));
        when(snapshots.byRef(owner, ref)).thenReturn(new JobResultSnapshotUseCase.Snapshot(job(JobStatus.READY), stored));
        when(downloads.sign(any())).thenAnswer(call -> {
            PrivateDownloadRequest request = call.getArgument(0);
            return new PrivateDownload(url(), request.kind().mimeType(), 1024, request.sha256(), now.plusSeconds(60));
        });
        properties.getDisclosure().setResultRetentionSeconds(60);
        assertThat(useCase.byRef(owner, ref).result().expiresAt()).isEqualTo(now.plusSeconds(60));
        properties.getDisclosure().setResultRetentionSeconds(3600);
        assertThat(useCase.byRef(owner, ref).result().expiresAt()).isEqualTo(now.plusSeconds(60));
    }

    @Test void signaturesNeverReceiveDeadlineBeyondStoredSnapshot() {
        var stored = new ReadyResultReference(100, 200, reference.imageObjectKey(), reference.imageSha256(), 1024,
            reference.manifestObjectKey(), reference.manifestSha256(), now, now.plusSeconds(60));
        when(snapshots.byRef(owner, ref)).thenReturn(new JobResultSnapshotUseCase.Snapshot(job(JobStatus.READY), stored));
        when(downloads.sign(any())).thenAnswer(call -> {
            PrivateDownloadRequest request = call.getArgument(0);
            assertThat(request.resultExpiresAt()).isEqualTo(now.plusSeconds(60));
            return new PrivateDownload(url(), request.kind().mimeType(), 1024, request.sha256(), now.plusSeconds(60));
        });
        assertThat(useCase.byRef(owner, ref).result().expiresAt()).isEqualTo(now.plusSeconds(60));
    }

    @Test void idempotencyLookupThenRevalidationUsesResolvedOwnerAndReference() {
        var key = UUID.randomUUID();
        when(snapshots.byIdempotency(owner, key)).thenReturn(snapshot(JobStatus.READY));
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY));
        when(downloads.sign(any())).thenAnswer(call -> download(call.getArgument(0)));
        assertThat(useCase.byIdempotency(owner, key).result()).isNotNull();
        verify(snapshots).byIdempotency(owner, key);
        verify(snapshots).byRef(owner, ref);
    }

    @ParameterizedTest @EnumSource(value = JobStatus.class, names = "READY", mode = EnumSource.Mode.EXCLUDE)
    void nonReadyStatesNeverTouchStorage(JobStatus status) {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(status));
        assertThat(useCase.byRef(owner, ref).result()).isNull();
        verifyNoInteractions(downloads);
    }

    @Test void ackDuringSigningSuppressesBothUrls() {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY), snapshot(JobStatus.RESULT_EXPIRED));
        when(downloads.sign(any())).thenAnswer(call -> download(call.getArgument(0)));
        var result = useCase.byRef(owner, ref);
        assertThat(result.job().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(result.result()).isNull();
    }

    @Test void storageFailureAfterAckReturnsExpiredInsteadOfPartialResult() {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY), snapshot(JobStatus.RESULT_EXPIRED));
        when(downloads.sign(any())).thenThrow(new IllegalStateException("private provider response"));
        assertThat(useCase.byRef(owner, ref).result()).isNull();
        verify(downloads).sign(any());
    }

    @Test void storageFailureWhileReadyIsSanitizedAndNotRetried() {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY));
        when(downloads.sign(any())).thenThrow(new IllegalStateException("private provider response"));
        assertUnavailable(() -> useCase.byRef(owner, ref));
        verify(downloads).sign(any());
    }

    @Test void wrongOwnerFailsBeforeSigning() {
        when(snapshots.byRef(owner, ref)).thenThrow(new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false));
        assertThatThrownBy(() -> useCase.byRef(owner, ref)).isInstanceOf(GatewayException.class).hasMessage("job-not-found");
        verifyNoInteractions(downloads);
    }

    @Test void changedArtifactCannotReuseAnEarlierSignature() {
        var changed = new ReadyResultReference(100, 200, reference.imageObjectKey(), "c".repeat(64), 1024,
            reference.manifestObjectKey(), reference.manifestSha256(), now);
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY),
            new JobResultSnapshotUseCase.Snapshot(job(JobStatus.READY), changed));
        doAnswer(call -> download(call.getArgument(0))).when(downloads).sign(any());
        assertUnavailable(() -> useCase.byRef(owner, ref));
    }

    @Test void mismatchedReturnedMetadataAndExpiredUrlsAreRejected() {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY));
        when(downloads.sign(any())).thenReturn(new PrivateDownload(url(), "image/webp", 1025, "a".repeat(64), now.plusSeconds(300)));
        assertUnavailable(() -> useCase.byRef(owner, ref));
        when(downloads.sign(any())).thenAnswer(call -> {
            var request = (PrivateDownloadRequest) call.getArgument(0);
            return new PrivateDownload(url(), request.kind().mimeType(), 1024, request.sha256(), now);
        });
        assertUnavailable(() -> useCase.byRef(owner, ref));
    }

    @Test void invalidRetentionNeverCreatesAnyUrl() {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY));
        for (int seconds : new int[] {0, -1, 3601}) {
            properties.getDisclosure().setResultRetentionSeconds(seconds);
            assertUnavailable(() -> useCase.byRef(owner, ref));
        }
        verifyNoInteractions(downloads);
    }

    @Test void nearDeadlineRequiresBothUrlsToStayWithinTheRemainingLifetime() {
        var referenceNearExpiry = new ReadyResultReference(100, 200, reference.imageObjectKey(), reference.imageSha256(), 1024,
            reference.manifestObjectKey(), reference.manifestSha256(), now.minusSeconds(3500));
        when(snapshots.byRef(owner, ref)).thenReturn(new JobResultSnapshotUseCase.Snapshot(job(JobStatus.READY), referenceNearExpiry));
        when(downloads.sign(any())).thenAnswer(call -> {
            var request = (PrivateDownloadRequest) call.getArgument(0);
            assertThat(request.resultExpiresAt()).isEqualTo(now.plusSeconds(100));
            return new PrivateDownload(url(), request.kind().mimeType(), 1024, request.sha256(), now.plusSeconds(100));
        });
        assertThat(useCase.byRef(owner, ref).result().expiresAt()).isEqualTo(now.plusSeconds(100));
        doAnswer(call -> download(call.getArgument(0))).when(downloads).sign(any());
        assertUnavailable(() -> useCase.byRef(owner, ref));
    }

    @Test void missingSecondSignatureNeverPublishesTheFirstOne() {
        when(snapshots.byRef(owner, ref)).thenReturn(snapshot(JobStatus.READY));
        when(downloads.sign(any())).thenAnswer(call -> {
            var request = (PrivateDownloadRequest) call.getArgument(0);
            return request.kind() == PrivateDownloadRequest.Kind.IMAGE ? download(request) : null;
        });
        assertUnavailable(() -> useCase.byRef(owner, ref));
        verify(downloads, times(2)).sign(any());
    }

    @Test void elapsedDeadlineAndFutureCompletionFailBeforeSigning() {
        for (Instant completed : new Instant[] {now.minusSeconds(3600), now.plusSeconds(1)}) {
            var invalidTime = new ReadyResultReference(100, 200, reference.imageObjectKey(), reference.imageSha256(), 1024,
                reference.manifestObjectKey(), reference.manifestSha256(), completed);
            when(snapshots.byRef(owner, ref)).thenReturn(new JobResultSnapshotUseCase.Snapshot(job(JobStatus.READY), invalidTime));
            assertUnavailable(() -> useCase.byRef(owner, ref));
        }
        verifyNoInteractions(downloads);
    }

    private ProcessingJob job(JobStatus status) {
        return new ProcessingJob(jobId, ref, owner, UUID.randomUUID(), UUID.randomUUID(), "0".repeat(64),
            status, DispatchStatus.DISPATCHED, null, now);
    }
    private JobResultSnapshotUseCase.Snapshot snapshot(JobStatus status) {
        return new JobResultSnapshotUseCase.Snapshot(job(status), status == JobStatus.READY ? reference : null);
    }
    private PrivateDownload download(PrivateDownloadRequest request) {
        return new PrivateDownload(url(), request.kind().mimeType(), 1024, request.sha256(), now.plusSeconds(300));
    }
    private URI url() { return URI.create("https://storage.googleapis.com/test/private/rendering/job?signature=secret"); }
    private void assertUnavailable(Runnable action) {
        assertThatThrownBy(action::run).isInstanceOf(GatewayException.class).hasMessage("storage-unavailable").hasNoCause();
    }
}
