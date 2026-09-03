package com.mangareader.domain.auth.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("RefreshToken — Domínio")
class RefreshTokenTest {
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 7, 10, 12, 0);

    private RefreshToken buildToken(LocalDateTime expiresAt) {
        return RefreshToken.builder()
                .userId(UUID.randomUUID())
                .tokenHash("a".repeat(64))
                .familyId(UUID.randomUUID())
                .expiresAt(expiresAt)
                .build();
    }

    @Test
    @DisplayName("Deve iniciar ativo (não revogado)")
    void deveIniciarAtivo() {
        var token = buildToken(NOW.plusDays(7));

        assertThat(token.isRevoked()).isFalse();
        assertThat(token.getRevokedAt()).isNull();
    }

    @Test
    @DisplayName("Deve marcar revogação com o instante informado")
    void deveRevogar() {
        var token = buildToken(NOW.plusDays(7));

        token.revoke(NOW);

        assertThat(token.isRevoked()).isTrue();
        assertThat(token.getRevokedAt()).isEqualTo(NOW);
    }

    @Test
    @DisplayName("Revogação deve ser idempotente (mantém o primeiro instante)")
    void revogacaoIdempotente() {
        var token = buildToken(NOW.plusDays(7));

        token.revoke(NOW);
        token.revoke(NOW.plusHours(1));

        assertThat(token.getRevokedAt()).isEqualTo(NOW);
    }

    @Test
    @DisplayName("Deve reportar expiração relativa ao instante dado")
    void deveReportarExpiracao() {
        var token = buildToken(NOW.plusDays(7));

        assertThat(token.isExpired(NOW)).isFalse();
        assertThat(token.isExpired(NOW.plusDays(8))).isTrue();
    }
}
