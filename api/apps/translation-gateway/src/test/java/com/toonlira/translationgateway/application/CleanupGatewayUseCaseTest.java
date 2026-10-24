package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.inOrder;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class CleanupGatewayUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");
    @TempDir Path directory;

    @Test
    void shouldCleanObjectsBeforeCommittingDatabaseRetention() {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        when(storage.deleteOlderThan(NOW.minusSeconds(3600))).thenReturn(2);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(3, 4));

        var result = new CleanupGatewayUseCase(persistence, storage, mock(OcrPersistenceUseCase.class),
            mock(TranslationPersistenceUseCase.class), mock(RenderingPersistenceUseCase.class), acknowledgedCleanup(0),
            mock(ResultExpirationUseCase.class), lifecycleCleanup(0), Clock.fixed(NOW, ZoneOffset.UTC)).execute();

        assertThat(result).isEqualTo(new CleanupGatewayUseCase.Result(2, 3, 4));
        verify(persistence).execute(NOW);
    }

    @Test
    void shouldStillApplyDatabaseRetentionWhenStorageCleanupFails() {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        var unavailable = new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
        when(storage.deleteOlderThan(NOW.minusSeconds(3600))).thenThrow(unavailable);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(3, 4));

        assertThatThrownBy(() -> new CleanupGatewayUseCase(persistence, storage, mock(OcrPersistenceUseCase.class),
            mock(TranslationPersistenceUseCase.class), mock(RenderingPersistenceUseCase.class), acknowledgedCleanup(0),
            mock(ResultExpirationUseCase.class), lifecycleCleanup(0), Clock.fixed(NOW, ZoneOffset.UTC)).execute())
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
            });
        verify(persistence).execute(NOW);
    }

    @Test
    void shouldStillCleanTtlAndMetadataWhenAcknowledgedObjectsAreDeferred() {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(0, 0));
        assertThatThrownBy(() -> new CleanupGatewayUseCase(persistence, storage, mock(OcrPersistenceUseCase.class),
            mock(TranslationPersistenceUseCase.class), mock(RenderingPersistenceUseCase.class), acknowledgedCleanup(1), mock(ResultExpirationUseCase.class), lifecycleCleanup(0), Clock.fixed(NOW, ZoneOffset.UTC)).execute())
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
            });
        verify(storage).deleteOlderThan(NOW.minusSeconds(3600));
        verify(persistence).execute(NOW);
    }

    @Test
    void shouldReconcileStaleRenderingThroughDurableCleanupWithoutBlockingTtlOnDeleteFailure() {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        var rendering = mock(RenderingPersistenceUseCase.class);
        when(rendering.failStale(NOW.minusSeconds(900), NOW, 100)).thenReturn(List.of("private/stale-one", "private/stale-two"));
        var lifecycle = lifecycleCleanup(1);
        when(storage.deleteOlderThan(NOW.minusSeconds(3600))).thenReturn(2);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(0, 0));
        assertThatThrownBy(() -> new CleanupGatewayUseCase(persistence, storage, mock(OcrPersistenceUseCase.class),
            mock(TranslationPersistenceUseCase.class), rendering, acknowledgedCleanup(0), mock(ResultExpirationUseCase.class), lifecycle, Clock.fixed(NOW, ZoneOffset.UTC)).execute())
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.getCause()).isNull();
            });
        var ordered = inOrder(rendering, lifecycle, storage);
        ordered.verify(rendering).failStale(NOW.minusSeconds(900), NOW, 100);
        ordered.verify(lifecycle).execute();
        ordered.verify(storage).deleteExpiredOriginals(NOW);
        ordered.verify(storage).deleteExpiredResults(NOW);
        ordered.verify(storage).deleteOlderThan(NOW.minusSeconds(3600));
        verify(storage).deleteOlderThan(NOW.minusSeconds(3600));
        verifyNoMoreInteractions(storage);
    }

    private CleanupAcknowledgedResultsUseCase acknowledgedCleanup(int deferred) {
        var cleanup = mock(CleanupAcknowledgedResultsUseCase.class);
        when(cleanup.execute()).thenReturn(new CleanupAcknowledgedResultsUseCase.Result(0, deferred));
        return cleanup;
    }

    private CleanupLifecycleObjectsUseCase lifecycleCleanup(int deferred) {
        var cleanup = mock(CleanupLifecycleObjectsUseCase.class);
        when(cleanup.execute()).thenReturn(new CleanupLifecycleObjectsUseCase.Result(0, deferred));
        return cleanup;
    }

    @Test
    void expiresResultsBeforeClaimingTheirObjectsForDeletion() {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        var expiration = mock(ResultExpirationUseCase.class);
        var cleanup = acknowledgedCleanup(0);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(0, 0));
        new CleanupGatewayUseCase(persistence, storage, mock(OcrPersistenceUseCase.class),
            mock(TranslationPersistenceUseCase.class), mock(RenderingPersistenceUseCase.class), cleanup, expiration, lifecycleCleanup(0),
            Clock.fixed(NOW, ZoneOffset.UTC)).execute();
        var ordered = inOrder(expiration, cleanup, storage);
        ordered.verify(expiration).execute();
        ordered.verify(cleanup).execute();
        ordered.verify(storage).deleteOlderThan(NOW.minusSeconds(3600));
    }

    @ParameterizedTest
    @ValueSource(strings = {"original", "ocr", "translation", "rendering", "expiration", "lifecycle", "ack", "metadata"})
    void databaseFailureInAnyPhaseStillRunsPrivateAgeFailsafeAndIsSanitized(String phase) {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        var ocr = mock(OcrPersistenceUseCase.class);
        var translation = mock(TranslationPersistenceUseCase.class);
        var rendering = mock(RenderingPersistenceUseCase.class);
        var expiration = mock(ResultExpirationUseCase.class);
        var originals = mock(OriginalExpirationUseCase.class);
        var lifecycle = lifecycleCleanup(0);
        var acknowledgements = acknowledgedCleanup(0);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(0, 0));
        var raw = new IllegalStateException("SELECT private/key sensitive token content");
        switch (phase) {
            case "original" -> when(originals.execute()).thenThrow(raw);
            case "ocr" -> when(ocr.failStale(NOW.minusSeconds(900), NOW, 100)).thenThrow(raw);
            case "translation" -> when(translation.failStale(NOW.minusSeconds(900), NOW, 100)).thenThrow(raw);
            case "rendering" -> when(rendering.failStale(NOW.minusSeconds(900), NOW, 100)).thenThrow(raw);
            case "expiration" -> when(expiration.execute()).thenThrow(raw);
            case "lifecycle" -> when(lifecycle.execute()).thenThrow(raw);
            case "ack" -> when(acknowledgements.execute()).thenThrow(raw);
            case "metadata" -> when(persistence.execute(NOW)).thenThrow(raw);
            default -> throw new AssertionError("Invalid fixture");
        }
        var cleanup = new CleanupGatewayUseCase(persistence, storage, ocr, translation, rendering,
            acknowledgements, expiration, lifecycle, Clock.fixed(NOW, ZoneOffset.UTC), originals);
        assertThatThrownBy(cleanup::execute).isInstanceOfSatisfying(GatewayException.class, error -> {
            assertThat(error.code()).isEqualTo(GatewayErrorCode.INTERNAL_ERROR);
            assertThat(error.getMessage()).isEqualTo("internal-error");
            assertThat(error.getCause()).isNull();
        });
        verify(storage).deleteOlderThan(NOW.minusSeconds(3600));
        verify(storage).deleteExpiredOriginals(NOW);
        verify(originals).execute();
        verify(persistence).execute(NOW);
        verify(expiration).execute();
        verify(lifecycle).execute();
        verify(acknowledgements).execute();
    }

    @Test
    void originalSweepFailureStillRunsMaximumAgeAndMetadataCleanup() {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        when(storage.deleteExpiredOriginals(NOW)).thenThrow(new IllegalStateException("synthetic private/key"));
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(0, 0));
        var cleanup = new CleanupGatewayUseCase(persistence, storage, mock(OcrPersistenceUseCase.class),
            mock(TranslationPersistenceUseCase.class), mock(RenderingPersistenceUseCase.class), acknowledgedCleanup(0),
            mock(ResultExpirationUseCase.class), lifecycleCleanup(0), Clock.fixed(NOW, ZoneOffset.UTC), mock(OriginalExpirationUseCase.class));
        assertThatThrownBy(cleanup::execute).isInstanceOfSatisfying(GatewayException.class, error -> {
            assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
            assertThat(error.getCause()).isNull();
        });
        verify(storage).deleteOlderThan(NOW.minusSeconds(3600));
        verify(persistence).execute(NOW);
    }

    @Test
    void sqlExpiryFailureStillPhysicallyRemovesDueOriginalWithoutTouchingReusableInput() throws Exception {
        var source = directory.resolve("reusable.png");
        Files.writeString(source, "synthetic source");
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(directory);
        var storage = new LocalObjectStorageAdapter(properties);
        var key = OriginalObjectKey.create(NOW.minusSeconds(1), 1);
        storage.store(key, source, "image/png", "a".repeat(64), NOW.minusSeconds(1));
        var originals = mock(OriginalExpirationUseCase.class);
        when(originals.execute()).thenThrow(new IllegalStateException("synthetic SQL unavailable"));
        var persistence = mock(CleanupPersistenceUseCase.class);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(0, 0));
        var cleanup = new CleanupGatewayUseCase(persistence, storage, mock(OcrPersistenceUseCase.class),
            mock(TranslationPersistenceUseCase.class), mock(RenderingPersistenceUseCase.class), acknowledgedCleanup(0),
            mock(ResultExpirationUseCase.class), lifecycleCleanup(0), Clock.fixed(NOW, ZoneOffset.UTC), originals);
        assertThatThrownBy(cleanup::execute).isInstanceOfSatisfying(GatewayException.class,
            error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.INTERNAL_ERROR));
        assertThat(Files.exists(directory.resolve(key))).isFalse();
        assertThat(Files.readString(source)).isEqualTo("synthetic source");
        verify(persistence).execute(NOW);
    }
}
