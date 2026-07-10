package com.mangareader.application.auth.port;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.mangareader.domain.auth.entity.RefreshToken;

/**
 * Port de saída — persistência de refresh tokens para rotação com detecção
 * de reuso.
 * <p>
 * Recebe sempre o token <strong>cru</strong>; o hash (SHA-256) é detalhe do
 * adapter — o use case nunca conhece a forma armazenada.
 */
public interface RefreshTokenRepositoryPort {
    RefreshToken store(String rawToken, UUID userId, UUID familyId, LocalDateTime expiresAt);

    Optional<RefreshToken> findByToken(String rawToken);

    void revoke(RefreshToken token);

    /** Revoga todos os tokens ativos da família (sessão inteira). */
    void revokeFamily(UUID familyId);

    /** Remove tokens expirados antes do instante dado (higiene). */
    long deleteExpiredBefore(LocalDateTime threshold);
}
