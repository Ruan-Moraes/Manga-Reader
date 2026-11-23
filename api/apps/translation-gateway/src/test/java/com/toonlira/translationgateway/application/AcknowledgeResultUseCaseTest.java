package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AcknowledgeResultUseCaseTest {
    @Test
    void passesOnlyTheAuthenticatedOwnerJobAndClockToTheTransaction() {
        var persistence = mock(ResultAcknowledgementPersistenceUseCase.class);
        var cleanup = mock(CleanupAcknowledgedResultsUseCase.class);
        var now = Instant.parse("2026-10-03T12:00:00Z");
        var owner = UUID.randomUUID();
        var job = UUID.randomUUID();
        when(cleanup.executeForJob(owner, job)).thenReturn(true);
        new AcknowledgeResultUseCase(persistence, cleanup, Clock.fixed(now, ZoneOffset.UTC)).execute(owner, job);
        var order = org.mockito.Mockito.inOrder(persistence, cleanup);
        order.verify(persistence).request(owner, job, now);
        order.verify(cleanup).executeForJob(owner, job);
    }

    @Test
    void returnsRetryableFailureWhenCleanupHasNotCompleted() {
        var persistence = mock(ResultAcknowledgementPersistenceUseCase.class);
        var cleanup = mock(CleanupAcknowledgedResultsUseCase.class);
        var owner = UUID.randomUUID();
        var job = UUID.randomUUID();
        assertThatThrownBy(() -> new AcknowledgeResultUseCase(persistence, cleanup, Clock.systemUTC()).execute(owner, job))
            .isInstanceOfSatisfying(com.toonlira.translationgateway.domain.GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE);
                assertThat(error.status()).isEqualTo(503);
            });
    }

    @Test
    void cleanupClaimCopiesTheCollectionAndRedactsItsRepresentation() {
        var id = UUID.randomUUID();
        var keys = new ArrayList<>(List.of("private/synthetic-sensitive-object"));
        var claim = new ResultAcknowledgementRepository.CleanupClaim(id, Instant.EPOCH, keys);
        keys.clear();
        assertThat(claim.objectKeys()).containsExactly("private/synthetic-sensitive-object");
        assertThatThrownBy(() -> claim.objectKeys().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThat(claim.toString()).doesNotContain(id.toString(), "private/", "synthetic-sensitive");
    }
}
