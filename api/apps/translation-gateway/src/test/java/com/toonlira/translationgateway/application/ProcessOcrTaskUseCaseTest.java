package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verifyNoInteractions;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

class ProcessOcrTaskUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-24T12:00:00Z");
    @TempDir Path temporary;
    private final CleanupLifecycleObjectsUseCase lifecycle = mock(CleanupLifecycleObjectsUseCase.class);

    @Test
    void expiredOriginalDoesNotReserveOrCallProvider() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var provider = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        when(provider.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);
        var useCase = worker(persistence, provider);
        when(persistence.originalAvailable(any(), any())).thenReturn(false);
        useCase.execute(job.jobRef());
        verify(persistence).failUnclaimed(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, NOW);
        verify(persistence, never()).claim(any(), any());
        verify(provider, never()).recognize(any());
        assertThat(Files.exists(temporary.resolve("private/ocr"))).isFalse();
    }

    @Test
    void originalExpiringDuringProviderDoesNotWriteManifestOrRepeatCall() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var provider = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        when(provider.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        var useCase = worker(persistence, provider);
        when(provider.recognize(any())).thenAnswer(call -> {
            when(persistence.originalAvailable(any(), any())).thenReturn(false);
            return List.of();
        });
        useCase.execute(job.jobRef());
        verify(provider, times(1)).recognize(any());
        verify(persistence).fail(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, NOW);
        verify(persistence, never()).complete(any(), any(), any(), any());
        assertThat(Files.exists(temporary.resolve("private/ocr"))).isFalse();
    }

    @Test
    void shouldFailClosedBeforeLookingUpAJobWhenProviderIsDisabled() {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var useCase = worker(persistence, ocr);
        assertThatThrownBy(() -> useCase.execute(UUID.randomUUID())).isInstanceOf(GatewayException.class)
            .extracting("code").isEqualTo(GatewayErrorCode.OCR_UNAVAILABLE);
        verify(persistence, never()).find(any());
        verifyNoInteractions(lifecycle);
    }

    @Test
    void shouldStoreManifestOnceAndRetainOriginalForRenderingAfterSuccessfulClaim() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        when(persistence.complete(eq(job.id()), any(), any(), any())).thenReturn(true);
        when(ocr.recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())))).thenReturn(List.of());

        worker(persistence, ocr).execute(job.jobRef());
        assertThat(Files.exists(temporary.resolve(job.objectKey()))).isTrue();
        assertThat(Files.walk(temporary.resolve("private/ocr")).filter(Files::isRegularFile).count()).isOne();
        verify(ocr).recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())));
        verify(persistence).complete(eq(job.id()), any(), any(), eq(NOW));
        verify(lifecycle).executeForJob(job.id());
    }

    @Test
    void shouldNotCallProviderForRedeliveredJob() {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        when(ocr.available()).thenReturn(true);
        var ref = UUID.randomUUID();
        when(persistence.find(ref)).thenReturn(new OcrJobRepository.WorkItem(UUID.randomUUID(), ref,
            JobStatus.OCR, "private/originals/ignored", "0".repeat(64), "image/png", 24, 1, 1, "ja"));
        worker(persistence, ocr).execute(ref);
        verify(ocr, never()).recognize(any());
    }

    @Test
    void shouldFailTamperedMediaWithoutClaimingOrCallingProvider() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        when(ocr.available()).thenReturn(true);
        var job = storedJob("image/png", 2, 1);
        when(persistence.find(job.jobRef())).thenReturn(job);
        worker(persistence, ocr).execute(job.jobRef());
        verify(persistence).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.OCR_INVALID_MEDIA), eq(NOW));
        verify(lifecycle).executeForJob(job.id());
        verify(persistence, never()).claim(any(), any());
        verify(ocr, never()).recognize(any());
    }

    @Test
    void shouldFailMissingOriginalWithoutCallingProvider() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        Files.delete(temporary.resolve(job.objectKey()));
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);

        worker(persistence, ocr).execute(job.jobRef());

        verify(persistence).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.OCR_UNAVAILABLE), eq(NOW));
        verify(persistence, never()).claim(any(), any());
        verify(ocr, never()).recognize(any());
    }

    @Test
    void shouldRejectInvalidProviderGeometryWithoutPersistingManifest() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        terminalAfterFailure(persistence, job);
        when(ocr.recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())))).thenReturn(List.of(
            new OcrManifest.Region(UUID.randomUUID(), 0, "text", List.of())));

        worker(persistence, ocr).execute(job.jobRef());

        verify(persistence).fail(eq(job.id()), eq(GatewayErrorCode.OCR_INVALID_RESPONSE), eq(NOW));
        verify(persistence, never()).complete(any(), any(), any(), any());
        assertThat(Files.exists(temporary.resolve(job.objectKey()))).isFalse();
    }

    @Test
    void shouldRemoveOrphanManifestWhenCommitFailsWithoutRetryingOcr() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        terminalAfterFailure(persistence, job);
        when(ocr.recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())))).thenReturn(List.of());
        when(persistence.complete(eq(job.id()), any(), any(), any())).thenThrow(new IllegalStateException("commit failed"));

        worker(persistence, ocr).execute(job.jobRef());

        assertThat(Files.exists(temporary.resolve(job.objectKey()))).isFalse();
        assertThat(Files.walk(temporary.resolve("private/ocr")).filter(Files::isRegularFile).count()).isZero();
        verify(ocr).recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())));
        verify(persistence).fail(eq(job.id()), eq(GatewayErrorCode.OCR_UNAVAILABLE), eq(NOW));
    }

    @Test
    void shouldDiscardManifestAfterCancellationDuringOcr() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        when(ocr.recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())))).thenReturn(List.of());
        when(persistence.complete(eq(job.id()), any(), any(), any())).thenAnswer(call -> {
            when(persistence.find(job.jobRef())).thenReturn(withStatus(job, JobStatus.CANCELLED));
            return false;
        });

        worker(persistence, ocr).execute(job.jobRef());

        assertThat(Files.exists(temporary.resolve(job.objectKey()))).isFalse();
        assertThat(Files.walk(temporary.resolve("private/ocr")).filter(Files::isRegularFile).count()).isZero();
        verify(ocr).recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())));
        verify(persistence, never()).fail(any(), any(), any());
        verify(lifecycle).executeForJob(job.id());
    }

    @Test
    void shouldKeepCommittedManifestWhenCommitAcknowledgementIsLost() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        var committed = new OcrJobRepository.WorkItem(job.id(), job.jobRef(), JobStatus.TRANSLATING,
            job.objectKey(), job.sha256(), job.mimeType(), job.byteSize(), job.widthPx(), job.heightPx(),
            job.sourceLanguage());
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job, committed);
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        when(ocr.recognize(eq(new OcrPort.Command(job.objectKey(), job.sourceLanguage(), job.jobRef(), job.widthPx(), job.heightPx())))).thenReturn(List.of());
        when(persistence.complete(eq(job.id()), any(), any(), any())).thenAnswer(call -> {
            when(persistence.findOutput(job.id())).thenReturn(new OcrJobRepository.OutputArtifact(call.getArgument(1), call.getArgument(2)));
            throw new IllegalStateException("ack lost");
        });

        worker(persistence, ocr).execute(job.jobRef());

        assertThat(Files.walk(temporary.resolve("private/ocr")).filter(Files::isRegularFile).count()).isOne();
        verify(persistence, never()).fail(any(), any(), any());
        assertThat(Files.exists(temporary.resolve(job.objectKey()))).isTrue();
    }

    @ParameterizedTest
    @EnumSource(value = JobStatus.class, names = {"RENDERING", "READY", "RESULT_EXPIRED"})
    void lostOcrAcknowledgementAfterLaterTransitionKeepsExactReferencedManifest(JobStatus state) throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        var current = new AtomicReference<>(job);
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenAnswer(call -> current.get());
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        when(ocr.recognize(any())).thenReturn(List.of());
        when(persistence.complete(eq(job.id()), any(), any(), any())).thenAnswer(call -> {
            current.set(new OcrJobRepository.WorkItem(job.id(), job.jobRef(), state, job.objectKey(), job.sha256(),
                job.mimeType(), job.byteSize(), job.widthPx(), job.heightPx(), job.sourceLanguage()));
            when(persistence.findOutput(job.id())).thenReturn(new OcrJobRepository.OutputArtifact(call.getArgument(1), call.getArgument(2)));
            throw new IllegalStateException("ack lost after later transition");
        });
        var worker = worker(persistence, ocr);
        worker.execute(job.jobRef());
        worker.execute(job.jobRef());
        try (var paths = Files.walk(temporary.resolve("private/ocr"))) {
            assertThat(paths.filter(Files::isRegularFile).count()).isOne();
        }
        verify(ocr, times(1)).recognize(any());
        verify(persistence, never()).fail(any(), any(), any());
    }

    @Test
    void failingPrevalidationDoesNotDeleteOriginalClaimedByAnotherDelivery() throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 2, 1);
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job, withStatus(job, JobStatus.OCR));
        worker(persistence, ocr).execute(job.jobRef());
        verify(persistence).failUnclaimed(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, NOW);
        verify(persistence, never()).fail(any(), any(), any());
        verify(ocr, never()).recognize(any());
        assertThat(Files.exists(temporary.resolve(job.objectKey()))).isTrue();
    }

    private void terminalAfterFailure(OcrPersistenceUseCase persistence, OcrJobRepository.WorkItem job) {
        doAnswer(call -> {
            when(persistence.find(job.jobRef())).thenReturn(withStatus(job, JobStatus.FAILED));
            return null;
        }).when(persistence).fail(any(), any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"lock", "read-after-lock"})
    void unresolvedFailureResolutionRetainsOcrManifestAndOriginal(String boundary) throws Exception {
        var persistence = mock(OcrPersistenceUseCase.class);
        var ocr = mock(OcrPort.class);
        var job = storedJob("image/png", 1, 1);
        when(ocr.available()).thenReturn(true);
        when(persistence.find(job.jobRef())).thenReturn(job);
        when(persistence.claim(eq(job.jobRef()), any())).thenReturn(OcrJobRepository.Claim.STARTED);
        when(ocr.recognize(any())).thenReturn(List.of());
        when(persistence.complete(any(), any(), any(), any())).thenThrow(new IllegalStateException("unknown commit"));
        doAnswer(call -> {
            if (boundary.equals("lock")) throw new IllegalStateException("unknown resolution");
            when(persistence.find(any())).thenThrow(new IllegalStateException("unknown read after resolution"));
            return null;
        }).when(persistence).fail(any(), any(), any());
        worker(persistence, ocr).execute(job.jobRef());
        try (var paths = Files.walk(temporary.resolve("private/ocr"))) {
            assertThat(paths.filter(Files::isRegularFile).count()).isOne();
        }
        assertThat(Files.exists(temporary.resolve(job.objectKey()))).isTrue();
        verify(persistence, times(1)).fail(job.id(), GatewayErrorCode.OCR_UNAVAILABLE, NOW);
        verify(ocr, times(1)).recognize(any());
    }

    private static OcrJobRepository.WorkItem withStatus(OcrJobRepository.WorkItem job, JobStatus status) {
        return new OcrJobRepository.WorkItem(job.id(), job.jobRef(), status, job.objectKey(), job.sha256(),
            job.mimeType(), job.byteSize(), job.widthPx(), job.heightPx(), job.sourceLanguage());
    }

    private ProcessOcrTaskUseCase worker(OcrPersistenceUseCase persistence, OcrPort ocr) {
        // These existing fixtures represent a fresh accepted source; expiry-specific tests override after construction.
        when(persistence.originalAvailable(any(), any())).thenReturn(true);
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(temporary);
        return new ProcessOcrTaskUseCase(persistence, new LocalObjectStorageAdapter(properties),
            new MediaInspectionService(), ocr, new OcrManifestService(GatewayJsonMapper.create()), properties,
            Clock.fixed(NOW, ZoneOffset.UTC), lifecycle);
    }

    private OcrJobRepository.WorkItem storedJob(String mime, int expectedWidth, int expectedHeight) throws Exception {
        var bytes = new byte[24];
        byte[] header = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(header, 0, bytes, 0, header.length);
        System.arraycopy("IHDR".getBytes(java.nio.charset.StandardCharsets.US_ASCII), 0, bytes, 12, 4);
        bytes[19] = 1;
        bytes[23] = 1;
        var hash = java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(bytes));
        var id = UUID.randomUUID();
        var key = "private/originals/" + id;
        var path = temporary.resolve(key);
        Files.createDirectories(path.getParent());
        Files.write(path, bytes);
        return new OcrJobRepository.WorkItem(id, UUID.randomUUID(), JobStatus.QUEUED, key, hash, mime,
            bytes.length, expectedWidth, expectedHeight, "ja");
    }
}
