package com.mangareader.infrastructure.persistence.postgres.repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.auth.entity.RefreshToken;

import jakarta.persistence.LockModeType;

public interface RefreshTokenJpaRepository extends JpaRepository<RefreshToken, UUID> {
    // Serializa refresh e logout para que nenhum sucessor seja inserido após
    // uma revogação concorrente da família.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
            UPDATE RefreshToken rt
               SET rt.revokedAt = :now
             WHERE rt.id = :id
               AND rt.revokedAt IS NULL
            """)
    int revokeIfActive(@Param("id") UUID id, @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            UPDATE RefreshToken rt
               SET rt.revokedAt = :now
             WHERE rt.familyId = :familyId
               AND rt.revokedAt IS NULL
            """)
    int revokeFamily(@Param("familyId") UUID familyId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            UPDATE RefreshToken rt
               SET rt.revokedAt = :now
             WHERE rt.userId = :userId
               AND rt.revokedAt IS NULL
            """)
    int revokeAllForUser(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    long deleteByExpiresAtBefore(LocalDateTime threshold);
}
