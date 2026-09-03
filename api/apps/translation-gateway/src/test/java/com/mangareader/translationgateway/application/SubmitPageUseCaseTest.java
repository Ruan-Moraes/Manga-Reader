package com.mangareader.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mangareader.translationgateway.application.port.ObjectStoragePort;
import com.mangareader.translationgateway.domain.DispatchStatus;
import com.mangareader.translationgateway.domain.GatewayErrorCode;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.domain.JobStatus;
import com.mangareader.translationgateway.domain.ProcessingJob;
import com.mangareader.translationgateway.application.config.GatewayProperties;
import java.io.ByteArrayInputStream;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SubmitPageUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");
    private GetCapabilitiesUseCase capabilities;
    private MediaInspectionService mediaInspector;
    private ObjectStoragePort storage;
    private ReserveJobUseCase reservation;
    private DispatchPendingJobsUseCase dispatcher;
    private SubmitPageUseCase useCase;
    private UUID installationId;
    private UUID idempotencyKey;
    private UUID attemptRef;
    private SubmitPageUseCase.Command command;
    private MediaInspectionService.InspectedMedia media;

    @BeforeEach
    void setUp() {
        capabilities = mock(GetCapabilitiesUseCase.class);
        mediaInspector = mock(MediaInspectionService.class);
        storage = mock(ObjectStoragePort.class);
        reservation = mock(ReserveJobUseCase.class);
        dispatcher = mock(DispatchPendingJobsUseCase.class);
        var properties = GetCapabilitiesUseCaseTest.validProperties();
        useCase = new SubmitPageUseCase(capabilities, mediaInspector, storage, reservation, dispatcher, properties,
            Clock.fixed(NOW, ZoneOffset.UTC));
        installationId = UUID.randomUUID();
        idempotencyKey = UUID.randomUUID();
        attemptRef = UUID.randomUUID();
        command = new SubmitPageUseCase.Command("image/png", 32, 1, 1, "ja", "pt-BR", "privacy-2026-09", attemptRef);
        media = new MediaInspectionService.InspectedMedia(Path.of("unused.upload"), "image/png", 32, 1, 1, "a".repeat(64));
        when(capabilities.execute()).thenReturn(capabilitiesView());
        when(mediaInspector.inspect(any(), any(Long.class))).thenReturn(media);
    }

    @Test
    void shouldUploadReserveAndDispatchANewJob() {
        var job = job();
        when(reservation.execute(any())).thenReturn(new ReserveJobUseCase.Result(job, true));

        var result = useCase.execute(installationId, idempotencyKey, command, new ByteArrayInputStream(new byte[0]));

        assertThat(result.created()).isTrue();
        verify(storage).store(anyString(), any(), org.mockito.ArgumentMatchers.eq("image/png"),
            org.mockito.ArgumentMatchers.eq("a".repeat(64)), org.mockito.ArgumentMatchers.eq(NOW));
        verify(dispatcher).dispatchBestEffort();
    }

    @Test
    void shouldDeleteTheRedundantUploadForAnIdempotentReplay() {
        when(reservation.execute(any())).thenReturn(new ReserveJobUseCase.Result(job(), false));

        var result = useCase.execute(installationId, idempotencyKey, command, new ByteArrayInputStream(new byte[0]));

        assertThat(result.created()).isFalse();
        verify(storage).delete(anyString());
        verify(dispatcher, never()).dispatchBestEffort();
    }

    @Test
    void shouldPreserveTheReservationFailureEvenWhenOrphanDeletionFails() {
        var conflict = new GatewayException(GatewayErrorCode.JOB_STATE_CONFLICT, 409, false);
        when(reservation.execute(any())).thenThrow(conflict);
        doThrow(new IllegalStateException("delete unavailable")).when(storage).delete(anyString());

        assertThatThrownBy(() -> useCase.execute(installationId, idempotencyKey, command,
            new ByteArrayInputStream(new byte[0]))).isSameAs(conflict);
    }

    @Test
    void shouldRejectDisabledGatewayBeforeInspectingOrUploading() {
        doThrow(new GatewayException(GatewayErrorCode.GATEWAY_DISABLED, 503, true)).when(capabilities).requireEnabled();

        assertThatThrownBy(() -> useCase.execute(installationId, idempotencyKey, command,
            new ByteArrayInputStream(new byte[0])))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.GATEWAY_DISABLED));
        verify(mediaInspector, never()).inspect(any(), any(Long.class));
        verify(storage, never()).store(anyString(), any(), anyString(), anyString(), any());
    }

    private ProcessingJob job() {
        return new ProcessingJob(UUID.randomUUID(), UUID.randomUUID(), installationId, idempotencyKey, attemptRef,
            "b".repeat(64), JobStatus.QUEUED, DispatchStatus.PENDING, null, NOW);
    }

    private CapabilitiesView capabilitiesView() {
        var disclosure = new CapabilitiesView.LegalDisclosure("privacy-2026-09", "Manga Reader",
            "privacy@example.com", "https://example.com/privacy", "https://example.com/terms",
            "southamerica-east1", List.of("us", "us-central1"), 3600, 3600, 7, "No training");
        return new CapabilitiesView("1.0", "manga-reader-alpha", NOW, NOW.plusSeconds(300), true,
            GetCapabilitiesUseCase.LANGUAGES, List.of(new CapabilitiesView.LanguagePair("ja", "pt-BR")),
            new CapabilitiesView.MediaLimits(GetCapabilitiesUseCase.MIME_TYPES, 1000, 100, 100, 10000),
            20, 100, disclosure, "\"etag\"");
    }
}
