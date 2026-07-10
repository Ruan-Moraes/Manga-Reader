package com.mangareader.infrastructure.persistence.postgres.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;
import com.mangareader.domain.user.entity.User;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(RefreshTokenRepositoryAdapter.class)
@DisplayName("RefreshTokenRepositoryAdapter — Integração JPA")
class RefreshTokenRepositoryAdapterTest {

    @Autowired
    private RefreshTokenRepositoryPort refreshTokenRepository;

    @Autowired
    private TestEntityManager entityManager;

    private UUID userId;
    private final LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);

    @BeforeEach
    void setUp() {
        User user = entityManager.persistAndFlush(User.builder()
                .name("Leitor")
                .email("leitor@mangareader.com")
                .passwordHash("$2a$10$hash")
                .build());

        userId = user.getId();
    }

    @Test
    @DisplayName("Deve armazenar hash SHA-256 hex, nunca o token em claro")
    void devePersistirApenasHash() {
        String rawToken = "raw-jwt-refresh-token";

        var stored = refreshTokenRepository.store(rawToken, userId, UUID.randomUUID(), expiresAt);
        entityManager.flush();

        assertThat(stored.getId()).isNotNull();
        assertThat(stored.getCreatedAt()).isNotNull();
        assertThat(stored.getTokenHash())
                .hasSize(64)
                .matches("[0-9a-f]{64}")
                .isNotEqualTo(rawToken)
                .doesNotContain(rawToken);
    }

    @Test
    @DisplayName("Deve localizar pelo token cru (lookup via hash)")
    void deveLocalizarPeloTokenCru() {
        String rawToken = "raw-jwt-refresh-token";
        UUID familyId = UUID.randomUUID();

        refreshTokenRepository.store(rawToken, userId, familyId, expiresAt);
        entityManager.flush();

        var found = refreshTokenRepository.findByToken(rawToken);

        assertThat(found).isPresent();
        assertThat(found.get().getFamilyId()).isEqualTo(familyId);
        assertThat(refreshTokenRepository.findByToken("outro-token")).isEmpty();
    }

    @Test
    @DisplayName("Deve revogar um token individualmente")
    void deveRevogarToken() {
        var stored = refreshTokenRepository.store("token-1", userId, UUID.randomUUID(), expiresAt);
        entityManager.flush();

        refreshTokenRepository.revoke(stored);
        entityManager.flush();
        entityManager.clear();

        var found = refreshTokenRepository.findByToken("token-1");

        assertThat(found).isPresent();
        assertThat(found.get().isRevoked()).isTrue();
    }

    @Test
    @DisplayName("Deve revogar a família inteira em lote, sem afetar outras famílias")
    void deveRevogarFamiliaEmLote() {
        UUID familia = UUID.randomUUID();
        UUID outraFamilia = UUID.randomUUID();

        refreshTokenRepository.store("token-a", userId, familia, expiresAt);
        refreshTokenRepository.store("token-b", userId, familia, expiresAt);
        refreshTokenRepository.store("token-c", userId, outraFamilia, expiresAt);
        entityManager.flush();

        refreshTokenRepository.revokeFamily(familia);
        entityManager.clear();

        assertThat(refreshTokenRepository.findByToken("token-a").orElseThrow().isRevoked()).isTrue();
        assertThat(refreshTokenRepository.findByToken("token-b").orElseThrow().isRevoked()).isTrue();
        assertThat(refreshTokenRepository.findByToken("token-c").orElseThrow().isRevoked()).isFalse();
    }

    @Test
    @DisplayName("Deve remover apenas tokens expirados antes do limiar")
    void deveRemoverExpirados() {
        refreshTokenRepository.store("token-velho", userId, UUID.randomUUID(), LocalDateTime.now().minusDays(1));
        refreshTokenRepository.store("token-vivo", userId, UUID.randomUUID(), expiresAt);
        entityManager.flush();

        long removed = refreshTokenRepository.deleteExpiredBefore(LocalDateTime.now());
        entityManager.flush();
        entityManager.clear();

        assertThat(removed).isEqualTo(1);
        assertThat(refreshTokenRepository.findByToken("token-velho")).isEmpty();
        assertThat(refreshTokenRepository.findByToken("token-vivo")).isPresent();
    }
}
