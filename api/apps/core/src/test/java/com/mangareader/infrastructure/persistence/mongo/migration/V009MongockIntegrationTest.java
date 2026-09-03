package com.mangareader.infrastructure.persistence.mongo.migration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;
import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;

import io.mongock.runner.springboot.EnableMongock;

/**
 * DT-21: valida {@link V009MigrateChaptersToCollection} pela <strong>
 * orquestração real do Mongock</strong> (runner no boot, lock de changelog,
 * guarda de idempotência), não via {@code execute()} direto.
 *
 * <p>Dados legados (schema pré-V009: {@code titles.chapters[]} embedded,
 * incluindo formas problemáticas citadas na DT-21) são semeados <em>antes</em>
 * do contexto Spring subir — em {@link #seedLegacyData} ({@code
 * @DynamicPropertySource} roda antes do refresh, logo antes do Mongock). A
 * mesma URI (container singleton + db dedicado) é usada para semear e para o
 * {@code MongoTemplate} do Mongock, garantindo que o runner enxergue o legado.
 *
 * <p>Mongock é {@code @Profile("!test")}; este teste usa o profile dedicado
 * {@code migration-it} e um app slim ({@link ItApp}) com {@code @EnableMongock}.
 * {@code ItApp} é {@code @Configuration} (não {@code @SpringBootConfiguration})
 * para não colidir com o {@code SpringBootConfigurationFinder} de outros testes
 * do mesmo pacote.
 */
@SpringBootTest(classes = V009MongockIntegrationTest.ItApp.class)
@ActiveProfiles("migration-it")
@Tag("testcontainers")
@DisplayName("V009 — integração via runner Mongock real (DT-21)")
class V009MongockIntegrationTest {

    private static final String DB = "v009_migration_it";
    private static final int LARGE_VOLUME = 2000;
    private static final String CHANGE_ID = "V009-migrate-chapters-to-collection";

    @Configuration
    @EnableAutoConfiguration
    @EnableMongock
    static class ItApp {
        @Bean
        JdbcTemplate jdbcTemplate() {
            JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
            when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class)))
                    .thenReturn(false);
            return jdbcTemplate;
        }
    }

    @Autowired
    private MongoTemplate mongoTemplate;

    private static String mongoUri() {
        return MongoTestContainerConfig.sharedContainer().getReplicaSetUrl(DB);
    }

    private static String mongoDb() {
        String db = new ConnectionString(mongoUri()).getDatabase();
        return db != null ? db : DB;
    }

    @DynamicPropertySource
    static void seedLegacyData(DynamicPropertyRegistry registry) {
        String uri = mongoUri();
        registry.add("spring.data.mongodb.uri", () -> uri);

        try (MongoClient client = MongoClients.create(uri)) {
            var db = client.getDatabase(mongoDb());
            for (String c : List.of("titles", "chapters",
                    "mongockChangeLog", "mongockLock")) {
                db.getCollection(c).drop();
            }
            MongoCollection<Document> titles = db.getCollection("titles");

            // Título normal — 2 capítulos.
            titles.insertOne(new Document("_id", "t-normal")
                    .append("name", new Document("pt-BR", "Normal"))
                    .append("chapters", List.of(
                            chapter("1", "Cap 1"),
                            chapter("2", "Cap 2"))));

            // _id não-String (ObjectId) — titleId deve virar toString().
            titles.insertOne(new Document("_id", new ObjectId())
                    .append("name", new Document("pt-BR", "ObjId"))
                    .append("chapters", List.of(chapter("1", "Único"))));

            // chapters malformado — elemento não-Document é ignorado.
            titles.insertOne(new Document("_id", "t-malformed")
                    .append("chapters", new ArrayList<>(List.of(
                            chapter("1", "Válido"),
                            "lixo-string-solta"))));

            // Volume grande — valida insertMany em lote.
            List<Object> many = new ArrayList<>(LARGE_VOLUME);
            for (int i = 1; i <= LARGE_VOLUME; i++) {
                many.add(chapter(String.valueOf(i), "Cap " + i));
            }
            titles.insertOne(new Document("_id", "t-large")
                    .append("chapters", many));

            // chapters vazio — $unset aplicado, zero capítulos.
            titles.insertOne(new Document("_id", "t-empty")
                    .append("chapters", new ArrayList<>()));

            // Sem campo chapters — intocado.
            titles.insertOne(new Document("_id", "t-nochap")
                    .append("name", new Document("pt-BR", "Sem caps")));
        }
    }

    private static Document chapter(String number, String title) {
        return new Document("number", number)
                .append("title", new Document("pt-BR", title))
                .append("releaseDate", "2025-01-01")
                .append("pages", "30");
    }

    @Test
    @DisplayName("Mongock roda V009 no boot: migra legado, $unset, guarda armada")
    void migraViaMongock() {
        var titles = mongoTemplate.getCollection("titles");
        var chapters = mongoTemplate.getCollection("chapters");

        long expected = 2 + 1 + 1 + LARGE_VOLUME;
        assertThat(chapters.countDocuments()).isEqualTo(expected);

        // Nenhum título retém o campo chapters (inclusive o de array vazio).
        assertThat(titles.countDocuments(
                new Document("chapters", new Document("$exists", true))))
                .isZero();

        // _id não-String → titleId via toString() (ObjectId hex de 24 chars).
        var objIdDoc = titles.find(
                new Document("_id", new Document("$type", "objectId")))
                .first();
        assertThat(objIdDoc).isNotNull();
        String objIdStr = objIdDoc.get("_id").toString();
        assertThat(chapters.countDocuments(
                new Document("titleId", objIdStr))).isEqualTo(1);

        // Malformado: só o capítulo Document válido migrou.
        assertThat(chapters.countDocuments(
                new Document("titleId", "t-malformed"))).isEqualTo(1);

        // Volume grande migrado por completo.
        assertThat(chapters.countDocuments(
                new Document("titleId", "t-large"))).isEqualTo(LARGE_VOLUME);

        // chapters vazio: zero capítulos, título preservado sem o campo.
        assertThat(chapters.countDocuments(
                new Document("titleId", "t-empty"))).isZero();
        assertThat(titles.find(new Document("_id", "t-empty")).first())
                .isNotNull();

        // Título sem capítulos intocado.
        var nochap = titles.find(new Document("_id", "t-nochap")).first();
        assertThat(nochap).isNotNull();
        assertThat(nochap.get("name")).isNotNull();

        // Guarda de idempotência do Mongock: changelog registrou V009.
        long v009Log = mongoTemplate.getCollection("mongockChangeLog")
                .countDocuments(new Document("changeId", CHANGE_ID));
        assertThat(v009Log).isPositive();
    }

    @Test
    @DisplayName("Reboot do Mongock não reprocessa (guarda real de changelog)")
    void rebootIdempotente() {
        long countBefore = mongoTemplate.getCollection("chapters")
                .countDocuments();
        assertThat(countBefore).isPositive();

        // Args (não .properties()) — precedência alta, sobrepõe o
        // spring.data.mongodb.uri do application.yml default.
        try (ConfigurableApplicationContext ctx = new SpringApplicationBuilder(
                ItApp.class)
                .web(WebApplicationType.NONE)
                .profiles("migration-it")
                .run(
                        "--spring.data.mongodb.uri=" + mongoUri(),
                        "--spring.docker.compose.enabled=false")) {
            var template = ctx.getBean(MongoTemplate.class);
            assertThat(template.getCollection("chapters").countDocuments())
                    .isEqualTo(countBefore);
        }
    }
}
