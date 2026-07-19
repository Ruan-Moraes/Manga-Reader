package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;
import com.mangareader.domain.auth.entity.RefreshToken;
import com.mangareader.infrastructure.persistence.postgres.repository.RefreshTokenJpaRepository;
import com.mangareader.shared.dto.ApiErrorCode;
import com.mangareader.shared.exception.BusinessRuleException;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link RefreshTokenRepositoryPort} com Spring Data JPA.
 * <p>
 * O token cru nunca é persistido: todo acesso passa por SHA-256 hex, de forma
 * que um vazamento do banco não permite reconstruir os JWTs.
 */
@Component
@RequiredArgsConstructor
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepositoryPort {
    private final RefreshTokenJpaRepository repository;

    @Override
    public RefreshToken store(String rawToken, UUID userId, UUID familyId, LocalDateTime expiresAt) {
        try {
            return repository.saveAndFlush(RefreshToken.builder()
                    .userId(userId)
                    .tokenHash(sha256Hex(rawToken))
                    .familyId(familyId)
                    .expiresAt(expiresAt)
                    .build());
        } catch (DataIntegrityViolationException e) {
            throw new BusinessRuleException(
                    "Não foi possível emitir uma sessão única. Tente novamente.",
                    409,
                    ApiErrorCode.AUTH_REFRESH_TOKEN_CONFLICT
            );
        }
    }

    @Override
    public Optional<RefreshToken> findByToken(String rawToken) {
        return repository.findByTokenHash(sha256Hex(rawToken));
    }

    @Override
    public boolean revokeIfActive(RefreshToken token) {
        return repository.revokeIfActive(token.getId(), LocalDateTime.now()) == 1;
    }

    @Override
    public void revokeFamily(UUID familyId) {
        repository.revokeFamily(familyId, LocalDateTime.now());
    }

    @Override
    public void revokeAllForUser(UUID userId) {
        repository.revokeAllForUser(userId, LocalDateTime.now());
    }

    @Override
    public long deleteExpiredBefore(LocalDateTime threshold) {
        return repository.deleteByExpiresAtBefore(threshold);
    }

    private static String sha256Hex(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível na JVM", e);
        }
    }
}
