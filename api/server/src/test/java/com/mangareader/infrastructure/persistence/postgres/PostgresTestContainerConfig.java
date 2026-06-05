package com.mangareader.infrastructure.persistence.postgres;

import java.time.Duration;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Postgres real via Testcontainers para testes que dependem de recursos
 * específicos do PostgreSQL não suportados pelo H2 (ex.: funções JSONB como
 * {@code jsonb_each_text}).
 *
 * <p>DT-22: container <strong>singleton por JVM</strong> (mesmo padrão de
 * {@code MongoTestContainerConfig} — DT-20). Iniciado uma vez em bloco
 * {@code static} com espera de startup; {@link #stop()} no-op para sobreviver
 * ao fechamento de contextos Spring (cache LRU). Ryuk limpa no fim da JVM.
 */
@TestConfiguration
public class PostgresTestContainerConfig {

    /** SELF concreto: {@code PostgreSQLContainer<SELF>} não permite subclasse
     *  anônima. {@link #stop()} no-op mantém o singleton vivo entre contextos. */
    static final class ReusablePostgres
            extends PostgreSQLContainer<ReusablePostgres> {
        ReusablePostgres() {
            super("postgres:17");
        }

        @Override
        public void stop() {
            // Singleton: ignorar stop por fechamento de contexto Spring.
        }
    }

    private static final ReusablePostgres POSTGRES_CONTAINER;

    static {
        POSTGRES_CONTAINER = new ReusablePostgres();
        POSTGRES_CONTAINER.withStartupTimeout(Duration.ofSeconds(120));
        POSTGRES_CONTAINER.start();
    }

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return POSTGRES_CONTAINER;
    }
}
