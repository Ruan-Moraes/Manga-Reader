package com.mangareader.infrastructure.security.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefreshTokenCleanupJob")
class RefreshTokenCleanupJobTest {
    @Mock
    private RefreshTokenRepositoryPort refreshTokenRepository;

    @InjectMocks
    private RefreshTokenCleanupJob job;

    @Test
    @DisplayName("Deve remover tokens expirados há mais de 1 dia")
    void deveRemoverExpiradosComFolgaDeUmDia() {
        when(refreshTokenRepository.deleteExpiredBefore(any())).thenReturn(3L);

        job.purgeExpiredTokens();

        var captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(refreshTokenRepository).deleteExpiredBefore(captor.capture());

        // Limiar ~1 dia atrás: tokens revogados recentes ficam p/ detecção de reuso
        assertThat(captor.getValue())
                .isBefore(LocalDateTime.now().minusHours(23))
                .isAfter(LocalDateTime.now().minusHours(25));
    }
}
