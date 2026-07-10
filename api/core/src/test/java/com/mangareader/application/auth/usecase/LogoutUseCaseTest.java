package com.mangareader.application.auth.usecase;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;
import com.mangareader.domain.auth.entity.RefreshToken;

@ExtendWith(MockitoExtension.class)
@DisplayName("LogoutUseCase")
class LogoutUseCaseTest {
    @Mock
    private RefreshTokenRepositoryPort refreshTokenRepository;

    @InjectMocks
    private LogoutUseCase logoutUseCase;

    private final UUID FAMILY_ID = UUID.randomUUID();
    private final String REFRESH_TOKEN = "refresh.jwt.token";

    @Test
    @DisplayName("Deve revogar a família inteira do token apresentado")
    void deveRevogarFamilia() {
        RefreshToken stored = RefreshToken.builder()
                .userId(UUID.randomUUID())
                .tokenHash("a".repeat(64))
                .familyId(FAMILY_ID)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        when(refreshTokenRepository.findByToken(REFRESH_TOKEN)).thenReturn(Optional.of(stored));

        logoutUseCase.execute(REFRESH_TOKEN);

        verify(refreshTokenRepository).revokeFamily(FAMILY_ID);
    }

    @Test
    @DisplayName("Token desconhecido deve ser no-op (idempotente)")
    void tokenDesconhecidoNoOp() {
        when(refreshTokenRepository.findByToken(REFRESH_TOKEN)).thenReturn(Optional.empty());

        logoutUseCase.execute(REFRESH_TOKEN);

        verify(refreshTokenRepository, never()).revokeFamily(any());
    }

    @Test
    @DisplayName("Token nulo ou em branco deve ser no-op sem tocar o repositório")
    void tokenAusenteNoOp() {
        logoutUseCase.execute(null);
        logoutUseCase.execute("  ");

        verify(refreshTokenRepository, never()).findByToken(any());
        verify(refreshTokenRepository, never()).revokeFamily(any());
    }
}
