package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.CleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** translation_context_terms (V12) on a real PostgreSQL: scoping, first decision, expiry, renewal and constraints. */
@Tag("testcontainers")
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ChapterMemoryPersistenceTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    private static final Instant NOW = Instant.parse("2026-11-18T12:00:00Z");
    private static final LanguagePair PAIR = new LanguagePair("en", "pt-BR");
    @Autowired ChapterMemoryRepository memory;
    @Autowired GatewayRepository gateway;
    @Autowired CleanupPersistenceUseCase cleanup;
    @Autowired JdbcClient jdbc;
    @Autowired TransactionTemplate transaction;

    private UUID installation() {
        var id = UUID.randomUUID();
        transaction.executeWithoutResult(ignored -> gateway.createInstallation(id, "test-hash-" + id, NOW));
        return id;
    }

    @Test
    void theFirstDecisionOfAChapterWinsAndStaysInsideItsInstallationContextAndPair() {
        var owner = installation();
        var other = installation();
        var chapter = UUID.randomUUID();
        memory.remember(owner, chapter, PAIR, Map.of("Basil", "Manjericão"), List.of("Basil"), NOW, NOW.plusSeconds(3600));
        // A page deciding the same term later does not change it.
        memory.remember(owner, chapter, PAIR, Map.of("Basil", "Basil"), List.of("Basil"), NOW.plusSeconds(5), NOW.plusSeconds(3605));
        assertThat(memory.find(owner, chapter, PAIR, NOW.plusSeconds(10))).isEqualTo(Map.of("Basil", "Manjericão"));
        // Another chapter, another installation or another pair sees nothing.
        assertThat(memory.find(owner, UUID.randomUUID(), PAIR, NOW)).isEmpty();
        assertThat(memory.find(other, chapter, PAIR, NOW)).isEmpty();
        assertThat(memory.find(owner, chapter, new LanguagePair("en", "es"), NOW)).isEmpty();
        // A page of the chapter writing the word in lower case forgets it, only in that chapter.
        memory.remember(other, chapter, PAIR, Map.of("Basil", "Basil"), List.of(), NOW, NOW.plusSeconds(3600));
        memory.forget(owner, chapter, PAIR, List.of("Basil", "Thyme"));
        assertThat(memory.find(owner, chapter, PAIR, NOW.plusSeconds(10))).isEmpty();
        assertThat(memory.find(other, chapter, PAIR, NOW.plusSeconds(10))).isEqualTo(Map.of("Basil", "Basil"));
    }

    @Test
    void termsExpireWithTheResultRetentionUnlessALaterPageUsesThemAgain() {
        var owner = installation();
        var chapter = UUID.randomUUID();
        memory.remember(owner, chapter, PAIR, Map.of("Basil", "Manjericão", "Sage", "Sálvia"), List.of(), NOW, NOW.plusSeconds(3600));
        // A later page uses "Basil" again: renewed; "Sage" is not.
        memory.remember(owner, chapter, PAIR, Map.of(), List.of("Basil"), NOW.plusSeconds(1800), NOW.plusSeconds(5400));
        assertThat(memory.find(owner, chapter, PAIR, NOW.plusSeconds(4000))).isEqualTo(Map.of("Basil", "Manjericão"));
        assertThat(memory.find(owner, chapter, PAIR, NOW.plusSeconds(5400))).isEmpty();
        // An expired term is decided anew by the next page that needs it.
        memory.remember(owner, chapter, PAIR, Map.of("Sage", "Salva"), List.of("Sage"), NOW.plusSeconds(6000), NOW.plusSeconds(9600));
        assertThat(memory.find(owner, chapter, PAIR, NOW.plusSeconds(6001))).isEqualTo(Map.of("Sage", "Salva"));
        // The cleanup deletes only what expired.
        int before = jdbc.sql("SELECT count(*) FROM translation_context_terms").query(Integer.class).single();
        assertThat(cleanup.execute(NOW.plusSeconds(6001)).chapterTermsDeleted()).isEqualTo(1);
        assertThat(jdbc.sql("SELECT count(*) FROM translation_context_terms").query(Integer.class).single()).isEqualTo(before - 1);
    }

    @Test
    void constraintsRejectEmptyTermsSamePairsAndLongLives() {
        var owner = installation();
        for (var values : new String[] {
            "'en', 'pt-BR', ' ', 'x', CAST(:now AS timestamptz), CAST(:now AS timestamptz) + interval '1 hour'",
            "'en', 'en', 'Basil', 'x', CAST(:now AS timestamptz), CAST(:now AS timestamptz) + interval '1 hour'",
            "'en', 'pt-BR', 'Basil', 'x', CAST(:now AS timestamptz), CAST(:now AS timestamptz)",
            "'en', 'pt-BR', 'Basil', 'x', CAST(:now AS timestamptz), CAST(:now AS timestamptz) + interval '2 days'"}) {
            assertThatThrownBy(() -> jdbc.sql("INSERT INTO translation_context_terms (installation_id, context_ref, source_language, "
                    + "target_language, source_term, target_term, created_at, expires_at) VALUES (:id, :context, " + values + ")")
                .param("id", owner).param("context", UUID.randomUUID()).param("now", java.sql.Timestamp.from(NOW)).update())
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        }
    }
}
