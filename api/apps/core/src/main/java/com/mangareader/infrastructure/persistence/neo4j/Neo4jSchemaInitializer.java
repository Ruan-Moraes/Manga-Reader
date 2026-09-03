package com.mangareader.infrastructure.persistence.neo4j;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Cria as constraints do grafo social no boot (DT-48). Cypher idempotente
 * ({@code IF NOT EXISTS}) — sem ferramenta de migração de grafo enquanto o
 * schema for este nó único; se crescer, avaliar neo4j-migrations.
 * <p>
 * {@code @Profile("!test")}: os {@code @SpringBootTest} existentes sobem sem
 * servidor Neo4j (o driver é lazy e só conecta no primeiro statement).
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class Neo4jSchemaInitializer implements ApplicationRunner {

    public static final String USER_NODE_CONSTRAINT =
            "CREATE CONSTRAINT user_node_user_id IF NOT EXISTS "
            + "FOR (u:UserNode) REQUIRE u.userId IS UNIQUE";

    private final Neo4jClient neo4jClient;

    @Override
    public void run(ApplicationArguments args) {
        neo4jClient.query(USER_NODE_CONSTRAINT).run();
        log.info("Neo4j schema pronto: constraint de unicidade em UserNode.userId");
    }
}
