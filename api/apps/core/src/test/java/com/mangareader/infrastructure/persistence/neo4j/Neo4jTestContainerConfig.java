package com.mangareader.infrastructure.persistence.neo4j;

import java.time.Duration;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.Neo4jContainer;

/**
 * Neo4j real via Testcontainers para os testes do grafo social (DT-48).
 *
 * <p>Container <strong>singleton por JVM</strong> — mesmo padrão de
 * {@code PostgresTestContainerConfig}/{@code MongoTestContainerConfig}
 * (DT-20/DT-22): iniciado uma vez em bloco {@code static} com espera de
 * startup; {@link #stop()} no-op para sobreviver ao fechamento de contextos
 * Spring (cache LRU). Ryuk limpa no fim da JVM.
 */
@TestConfiguration
public class Neo4jTestContainerConfig {

    static final class ReusableNeo4j extends Neo4jContainer<ReusableNeo4j> {
        ReusableNeo4j() {
            super("neo4j:5.26-community");
        }

        @Override
        public void stop() {
            // Singleton: ignorar stop por fechamento de contexto Spring.
        }
    }

    private static final ReusableNeo4j NEO4J_CONTAINER;

    static {
        NEO4J_CONTAINER = new ReusableNeo4j();
        NEO4J_CONTAINER.withAdminPassword("test_secret");
        NEO4J_CONTAINER.withStartupTimeout(Duration.ofSeconds(120));
        NEO4J_CONTAINER.start();
    }

    @Bean
    @ServiceConnection
    Neo4jContainer<?> neo4jContainer() {
        return NEO4J_CONTAINER;
    }
}
