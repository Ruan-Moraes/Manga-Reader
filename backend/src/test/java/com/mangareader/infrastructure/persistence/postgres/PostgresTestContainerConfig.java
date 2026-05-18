package com.mangareader.infrastructure.persistence.postgres;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Postgres real via Testcontainers para testes que dependem de recursos
 * específicos do PostgreSQL não suportados pelo H2 (ex.: funções JSONB como
 * {@code jsonb_each_text}).
 */
@TestConfiguration
public class PostgresTestContainerConfig {

    @Bean
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:17");
    }
}
