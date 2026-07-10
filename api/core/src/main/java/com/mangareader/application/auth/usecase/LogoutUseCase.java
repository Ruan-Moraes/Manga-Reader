package com.mangareader.application.auth.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Caso de uso: Logout — revogação server-side da sessão.
 * <p>
 * Revoga a família inteira do refresh token apresentado (a posse do token é
 * a credencial de revogação). Idempotente: token ausente, inválido ou já
 * revogado resulta em no-op — logout nunca falha para o cliente.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class LogoutUseCase {
    private final RefreshTokenRepositoryPort refreshTokenRepository;

    public void execute(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(stored -> refreshTokenRepository.revokeFamily(stored.getFamilyId()));
    }
}
