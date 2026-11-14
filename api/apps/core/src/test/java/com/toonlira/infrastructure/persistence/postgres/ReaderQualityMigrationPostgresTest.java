package com.toonlira.infrastructure.persistence.postgres;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;

@Tag("testcontainers")
class ReaderQualityMigrationPostgresTest {

    @Test
    void removesOnlyQualityFromExistingPreferences() {
        try (var postgres = new PostgreSQLContainer<>("postgres:17")) {
            postgres.start();
            var dataSource = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
            // V50 creates an index concurrently and requires a session-level lock.
            var flyway = Flyway.configure()
                    .dataSource(dataSource)
                    .configuration(Map.of("flyway.postgresql.transactional.lock", "false"));
            flyway.target("50").load().migrate();
            var jdbc = new JdbcTemplate(dataSource);
            jdbc.update("""
                    INSERT INTO users (id, name, email, password_hash, role, created_at)
                    VALUES ('00000000-0000-0000-0000-000000000051', 'Test Reader', 'reader@example.invalid', 'unused', 'MEMBER', now())
                    """);
            jdbc.update("""
                    INSERT INTO user_system_settings (user_id, reader_quality, reader_saturation, reader_mode, appearance_theme)
                    VALUES ('00000000-0000-0000-0000-000000000051', 'HIGH', 55, 'PAGED', 'LIGHT')
                    """);
            var previous = jdbc.queryForMap("SELECT * FROM user_system_settings");
            assertThat(previous.remove("reader_quality")).isEqualTo("HIGH");

            flyway.target("latest").load().migrate();

            assertThat(jdbc.queryForMap("SELECT * FROM user_system_settings")).isEqualTo(previous);
        }
    }
}
