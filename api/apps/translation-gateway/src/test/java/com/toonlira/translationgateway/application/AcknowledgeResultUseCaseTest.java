package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

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
        var repository = mock(ResultAcknowledgementRepository.class);
        var now = Instant.parse("2026-10-03T12:00:00Z");
        var owner = UUID.randomUUID();
        var job = UUID.randomUUID();
        new AcknowledgeResultUseCase(repository, Clock.fixed(now, ZoneOffset.UTC)).execute(owner, job);
        verify(repository).request(owner, job, now);
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
