package com.mangareader.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mangareader.translationgateway.application.port.ObjectStoragePort;
import com.mangareader.translationgateway.domain.GatewayErrorCode;
import com.mangareader.translationgateway.domain.GatewayException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class CleanupGatewayUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");

    @Test
    void shouldCleanObjectsBeforeCommittingDatabaseRetention() {
        var persistence = mock(CleanupPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        when(storage.deleteOlderThan(NOW.minusSeconds(3600))).thenReturn(2);
        when(persistence.execute(NOW)).thenReturn(new CleanupPersistenceUseCase.Result(3, 4));

        var result = new CleanupGatewayUseCase(persistence, storage, Clock.fixed(NOW, ZoneOffset.UTC)).execute();

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

        assertThatThrownBy(() -> new CleanupGatewayUseCase(persistence, storage,
            Clock.fixed(NOW, ZoneOffset.UTC)).execute()).isSameAs(unavailable);
        verify(persistence).execute(NOW);
    }
}
