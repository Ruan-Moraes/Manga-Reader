package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;
import com.mangareader.domain.auth.entity.RefreshToken;
import com.mangareader.infrastructure.persistence.postgres.repository.RefreshTokenJpaRepository;

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
        return repository.save(RefreshToken.builder()
                .userId(userId)
                .tokenHash(sha256Hex(rawToken))
                .familyId(familyId)
                .expiresAt(expiresAt)
                .build());
    }

    @Override
    public Optional<RefreshToken> findByToken(String rawToken) {
        return repository.findByTokenHash(sha256Hex(rawToken));
    }

    @Override
    public void revoke(RefreshToken token) {
        token.revoke(LocalDateTime.now());
        repository.save(token);
    }

    @Override
    public void revokeFamily(UUID familyId) {
        repository.revokeFamily(familyId, LocalDateTime.now());
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
