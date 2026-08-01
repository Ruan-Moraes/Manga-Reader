package com.mangareader.infrastructure.persistence.postgres;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.mangareader.infrastructure.persistence.postgres.repository.TitleAuthorJpaRepository;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PostgresTestContainerConfig.class)
@TestPropertySource(properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
@DisplayName("V44 — índices PostgreSQL da busca global")
@Tag("testcontainers")
class GlobalSearchIndexesPostgresTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TitleAuthorJpaRepository titleAuthors;

    @Test
    @DisplayName("Flyway aplica V44 e cria função e índices GIN")
    void appliesMigrationChain() {
        assertThat(jdbc.queryForObject(
                "SELECT success FROM flyway_schema_history WHERE version = '44'",
                Boolean.class)).isTrue();
        assertThat(jdbc.queryForObject(
                "SELECT mr_normalize_search('  Ação—Total  ')",
                String.class)).isEqualTo("acao total");
        assertThat(jdbc.queryForObject(
                "SELECT mr_localized_values_search('{\"pt-BR\":\"Equipe Sol\"}'::jsonb)",
                String.class)).isEqualTo("equipe sol");

        var indexes = jdbc.queryForList("""
                SELECT indexname
                FROM pg_indexes
                WHERE indexname IN (
                    'idx_authors_name_trgm',
                    'idx_groups_name_trgm',
                    'idx_groups_username_trgm')
                """, String.class);
        assertThat(indexes).containsExactlyInAnyOrder(
                "idx_authors_name_trgm",
                "idx_groups_name_trgm",
                "idx_groups_username_trgm");
    }

    @Test
    @DisplayName("EXPLAIN ANALYZE confirma uso do índice trigram de autores")
    void explainsAuthorSearchPlan() {
        jdbc.execute("""
                INSERT INTO authors (name, slug)
                SELECT 'Autor ' || number, 'autor-' || number
                FROM generate_series(1, 2000) number
                """);
        jdbc.update("INSERT INTO authors (name, slug) VALUES (?, ?)", "João da Ação", "joao-da-acao");
        jdbc.execute("ANALYZE authors");
        jdbc.execute("SET LOCAL enable_seqscan = off");

        var plan = String.join("\n", jdbc.queryForList("""
                EXPLAIN (ANALYZE, COSTS, FORMAT TEXT)
                SELECT id FROM authors
                WHERE mr_normalize_search(name) LIKE '%acao%'
                """, String.class));

        assertThat(plan).contains("idx_authors_name_trgm");
    }

    @Test
    @DisplayName("Referências de obras encontram alias de letterer")
    void titleReferencesIncludeAliasesAndLetterers() {
        Long authorId = jdbc.queryForObject(
                "INSERT INTO authors (name, slug) VALUES ('Nome Canônico', 'nome-canonico') RETURNING id",
                Long.class);
        jdbc.update("INSERT INTO author_aliases (author_id, name, type) VALUES (?, ?, 'PEN_NAME')",
                authorId, "Pseudônimo Solar");
        jdbc.update("INSERT INTO title_authors (title_id, author_id, role) VALUES (?, ?, 'LETTERER')",
                "title-lettered", authorId);

        var matches = titleAuthors.searchTitleReferences("pseudonimo");

        assertThat(matches).singleElement().satisfies(match -> {
            assertThat(match.getTitleId()).isEqualTo("title-lettered");
            assertThat(match.getMatchedText()).isEqualTo("Pseudônimo Solar");
            assertThat(match.getRole()).isEqualTo("LETTERER");
        });
    }
}
