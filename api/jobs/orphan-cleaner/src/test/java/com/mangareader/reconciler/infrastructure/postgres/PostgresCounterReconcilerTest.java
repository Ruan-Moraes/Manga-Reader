package com.mangareader.reconciler.infrastructure.postgres;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integração Postgres (TestContainers) dos updates idempotentes de contador
 * ({@code SET = COUNT}). Cria um schema mínimo (só as tabelas/colunas tocadas)
 * e valida a correção do drift.
 */
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PostgresCounterReconciler.class)
@Testcontainers
@Tag("testcontainers")
@DisplayName("PostgresCounterReconciler — Postgres IT")
class PostgresCounterReconcilerTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired private JdbcTemplate jdbc;
    @Autowired private PostgresCounterReconciler reconciler;

    @BeforeEach
    void setUp() {
        jdbc.execute("DROP TABLE IF EXISTS group_works, event_participants, groups, events");
        jdbc.execute("CREATE TABLE groups (id UUID PRIMARY KEY, total_titles INTEGER DEFAULT 0)");
        jdbc.execute("CREATE TABLE group_works (id UUID PRIMARY KEY, group_id UUID NOT NULL)");
        jdbc.execute("CREATE TABLE events (id UUID PRIMARY KEY, participants INTEGER DEFAULT 0)");
        jdbc.execute("CREATE TABLE event_participants (id UUID PRIMARY KEY, event_id UUID NOT NULL)");
    }

    @Test
    @DisplayName("reconcileTotalTitles corrige o drift para a contagem real de obras")
    void reconcileTotalTitlesCorrigeDrift() {
        jdbc.update("INSERT INTO groups (id, total_titles) VALUES ('11111111-1111-1111-1111-111111111111', 99)");
        jdbc.update("INSERT INTO group_works (id, group_id) VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111')");
        jdbc.update("INSERT INTO group_works (id, group_id) VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111')");

        int updated = reconciler.reconcileTotalTitles();

        assertThat(updated).isPositive();
        assertThat(totalTitles()).isEqualTo(2);
    }

    @Test
    @DisplayName("reconcileParticipants corrige o drift para a contagem real de inscritos")
    void reconcileParticipantsCorrigeDrift() {
        jdbc.update("INSERT INTO events (id, participants) VALUES ('22222222-2222-2222-2222-222222222222', 0)");
        jdbc.update("INSERT INTO event_participants (id, event_id) VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222')");
        jdbc.update("INSERT INTO event_participants (id, event_id) VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222')");
        jdbc.update("INSERT INTO event_participants (id, event_id) VALUES (gen_random_uuid(), '22222222-2222-2222-2222-222222222222')");

        int updated = reconciler.reconcileParticipants();

        assertThat(updated).isPositive();
        assertThat(participants()).isEqualTo(3);
    }

    private int totalTitles() {
        return jdbc.queryForObject("SELECT total_titles FROM groups LIMIT 1", Integer.class);
    }

    private int participants() {
        return jdbc.queryForObject("SELECT participants FROM events LIMIT 1", Integer.class);
    }
}
