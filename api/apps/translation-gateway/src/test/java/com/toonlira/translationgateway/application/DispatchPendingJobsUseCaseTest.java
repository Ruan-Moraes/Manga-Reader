package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.TaskDispatchPort;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DispatchPendingJobsUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");

    @Test
    void recoveryAfterTheLastPermittedAttemptNeverCreatesANinthTask() {
        var persistence = mock(DispatchPersistenceUseCase.class);
        var taskDispatch = mock(TaskDispatchPort.class);
        var properties = new GatewayProperties();
        var claim = new GatewayRepository.DispatchClaim(UUID.randomUUID(), UUID.randomUUID(), 9);
        when(persistence.claim(properties.getDispatch().getBatchSize(), NOW, NOW.plusSeconds(60)))
            .thenReturn(List.of(claim));
        assertThat(new DispatchPendingJobsUseCase(persistence, taskDispatch, properties,
            Clock.fixed(NOW, ZoneOffset.UTC)).execute()).isOne();
        verifyNoInteractions(taskDispatch);
        verify(persistence).fail(claim.jobId(), 9, 8, NOW);
    }

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
        verify(persistence).complete(claim.jobId(), claim.attemptCount(), NOW);
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
