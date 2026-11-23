package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ResultExpirationUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-10-04T12:00:00Z");
    private final ResultAcknowledgementRepository repository = mock(ResultAcknowledgementRepository.class);
    private final GatewayProperties properties = new GatewayProperties();

    @Test
    void scopedExpirationUsesOwnerAndOneHourDeadline() {
        var owner = UUID.randomUUID();
        var ref = UUID.randomUUID();
        useCase().expire(owner, ref);
        verify(repository).expire(owner, ref, NOW, NOW.minusSeconds(3600));
    }

    @Test
    void batchUsesConfiguredShorterRetentionAndFixedBound() {
        properties.getDisclosure().setResultRetentionSeconds(60);
        when(repository.expireBatch(100, NOW, NOW.minusSeconds(60))).thenReturn(3);
        assertThat(useCase().execute()).isEqualTo(3);
        verify(repository).expireBatch(100, NOW, NOW.minusSeconds(60));
    }

    @ParameterizedTest
    @ValueSource(ints = {-1, 0, 3601, Integer.MAX_VALUE})
    void invalidRetentionFailsClosedInsteadOfExtendingAvailability(int seconds) {
        properties.getDisclosure().setResultRetentionSeconds(seconds);
        useCase().execute();
        verify(repository).expireBatch(100, NOW, NOW);
    }

    @Test
    void rejectsMissingIdentityBeforeAccessingStorageOrDatabase() {
        assertThatThrownBy(() -> useCase().expire(null, UUID.randomUUID()))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("Invalid expiration lookup").hasNoCause();
        assertThatThrownBy(() -> useCase().expire(UUID.randomUUID(), null))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("Invalid expiration lookup").hasNoCause();
        verifyNoInteractions(repository);
    }

    private ResultExpirationUseCase useCase() {
        return new ResultExpirationUseCase(repository, properties, Clock.fixed(NOW, ZoneOffset.UTC));
    }
}
