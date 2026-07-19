package com.mangareader.reconciler.infrastructure.crossdb;

import static org.assertj.core.api.Assertions.assertThat;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.mongodb.client.MongoClients;
import com.mangareader.testing.mongo.Mongo8TestContainerFactory;

/**
 * Integração (Postgres + Mongo via TestContainers) da limpeza de órfãos cross-DB:
 * só apaga {@code title_id} que não existe mais em {@code titles}, trata {@code _id}
 * ObjectId e String, e aborta (guard anti-wipe) se o Mongo não devolver nada.
 */
@Testcontainers
@Tag("testcontainers")
@DisplayName("OrphanTitleRefReconciler — Postgres+Mongo IT")
class OrphanTitleRefReconcilerTest {
    private static final String EXISTS_HEX = "0123456789abcdef01234567";
    private static final String ORPHAN_HEX = "ffffffffffffffffffffffff";

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Container
    static MongoDBContainer mongo = Mongo8TestContainerFactory.create();

    static JdbcTemplate jdbc;
    static MongoTemplate mongoTemplate;
    static OrphanTitleRefReconciler reconciler;

    @BeforeAll
    static void wire() {
        DriverManagerDataSource ds = new DriverManagerDataSource(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        ds.setDriverClassName("org.postgresql.Driver");

        jdbc = new JdbcTemplate(ds);
        mongoTemplate = new MongoTemplate(MongoClients.create(mongo.getReplicaSetUrl()), "test");
        reconciler = new OrphanTitleRefReconciler(jdbc, mongoTemplate);
    }

    @BeforeEach
    void resetSchema() {
        for (String table : OrphanTitleRefReconciler.TITLE_REF_TABLES) {
            jdbc.execute("DROP TABLE IF EXISTS " + table);
            jdbc.execute("CREATE TABLE " + table + " (title_id VARCHAR(64) NOT NULL)");
        }

        mongoTemplate.getCollection("titles").drop();
    }

    @Test
    @DisplayName("Remove apenas as linhas cujo título não existe mais no Mongo")
    void removeApenasOrfaos() {
        insertTitleObjectId(EXISTS_HEX);
        insertRef("user_libraries", EXISTS_HEX);
        insertRef("user_libraries", ORPHAN_HEX);
        insertRef("store_titles", ORPHAN_HEX);

        var removed = reconciler.reconcile();

        assertThat(removed.get("user_libraries")).isEqualTo(1);
        assertThat(removed.get("store_titles")).isEqualTo(1);
        assertThat(rows("user_libraries")).isEqualTo(1); // o existente fica
        assertThat(rows("store_titles")).isZero();
    }

    @Test
    @DisplayName("Preserva título com _id String (seed/UUID), não tratando como órfão")
    void preservaTituloComIdString() {
        mongoTemplate.getCollection("titles").insertOne(new Document("_id", "seed-uuid-1"));
        insertRef("group_works", "seed-uuid-1");
        insertRef("group_works", ORPHAN_HEX);

        var removed = reconciler.reconcile();

        assertThat(removed.get("group_works")).isEqualTo(1);
        assertThat(rows("group_works")).isEqualTo(1); // o seed-uuid-1 permanece
    }

    @Test
    @DisplayName("Guard anti-wipe: não apaga nada se o Mongo não devolve nenhum título")
    void guardAntiWipe() {
        // Refs presentes, mas a coleção titles está vazia (simula falha/coleção sumida).
        insertRef("user_libraries", EXISTS_HEX);
        insertRef("title_authors", ORPHAN_HEX);

        var removed = reconciler.reconcile();

        assertThat(removed.values()).allMatch(n -> n == 0);
        assertThat(rows("user_libraries")).isEqualTo(1);
        assertThat(rows("title_authors")).isEqualTo(1);
    }

    @Test
    @DisplayName("Sem referências é no-op")
    void semReferencias() {
        var removed = reconciler.reconcile();

        assertThat(removed).containsKeys(
                "user_libraries", "group_works", "store_titles", "title_authors", "title_publishers");
        assertThat(removed.values()).allMatch(n -> n == 0);
    }

    private static void insertTitleObjectId(String hex) {
        mongoTemplate.getCollection("titles").insertOne(new Document("_id", new ObjectId(hex)));
    }

    private static void insertRef(String table, String titleId) {
        jdbc.update("INSERT INTO " + table + " (title_id) VALUES (?)", titleId);
    }

    private static int rows(String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
    }
}
