package com.mangareader.infrastructure.config;

import org.springframework.context.annotation.Configuration;

/**
 * Configuração do Neo4j (DT-48 — grafo social).
 * <p>
 * O acesso ao grafo é feito exclusivamente via {@code Neo4jClient} com Cypher
 * explícito (sem Spring Data repositories/@Node/OGM) — ver
 * {@code infrastructure/persistence/neo4j/adapter/SocialGraphNeo4jAdapter}.
 * <p>
 * <b>Transações:</b> deliberadamente NÃO declaramos um
 * {@code Neo4jTransactionManager}. Todas as operações do grafo são statements
 * Cypher únicos (auto-commit atômico no servidor), então não há transação
 * multi-statement a coordenar — e o tx manager JPA {@code @Primary}
 * ({@code TransactionManagerConfig}) continua resolvendo todo
 * {@code @Transactional} sem qualifier. Se um dia houver operação
 * multi-statement no grafo, declarar um bean <b>qualificado</b>
 * {@code neo4jTransactionManager} (nunca {@code @Primary}) — mesmo racional do
 * {@code mongoTransactionManager}.
 * <p>
 * Em dev, o {@code spring-boot-docker-compose} resolve os connection details do
 * serviço {@code neo4j} do compose; {@code spring.neo4j.*} no application.yml é
 * só fallback (compose desligado) e produção usa env vars.
 */
@Configuration
public class Neo4jConfiguration {
}
