package com.mangareader.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.application.port.TaskDispatchPort;
import com.mangareader.translationgateway.application.config.GatewayProperties;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DispatchPendingJobsUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");

    @Test
    void shouldCompleteEverySuccessfullyCreatedTask() {
        var persistence = mock(DispatchPersistenceUseCase.class);
        var taskDispatch = mock(TaskDispatchPort.class);
        var properties = new GatewayProperties();
        var claim = new GatewayRepository.DispatchClaim(UUID.randomUUID(), UUID.randomUUID(), 1);
        when(persistence.claim(properties.getDispatch().getBatchSize(), NOW, NOW.plusSeconds(60)))
            .thenReturn(List.of(claim));

        var processed = new DispatchPendingJobsUseCase(persistence, taskDispatch, properties,
            Clock.fixed(NOW, ZoneOffset.UTC)).execute();

        assertThat(processed).isOne();
        verify(taskDispatch).dispatch(claim.jobRef());
        verify(persistence).complete(claim.jobId(), NOW);
    }

    @Test
    void shouldOnlyRescheduleTaskCreationWhenDispatchFails() {
        var persistence = mock(DispatchPersistenceUseCase.class);
        var taskDispatch = mock(TaskDispatchPort.class);
        var properties = new GatewayProperties();
        var claim = new GatewayRepository.DispatchClaim(UUID.randomUUID(), UUID.randomUUID(), 3);
        when(persistence.claim(properties.getDispatch().getBatchSize(), NOW, NOW.plusSeconds(60)))
            .thenReturn(List.of(claim));
        doThrow(new IllegalStateException("provider unavailable")).when(taskDispatch).dispatch(claim.jobRef());

        new DispatchPendingJobsUseCase(persistence, taskDispatch, properties,
            Clock.fixed(NOW, ZoneOffset.UTC)).execute();

        verify(persistence).fail(claim.jobId(), 3, 8, NOW);
    }
}
