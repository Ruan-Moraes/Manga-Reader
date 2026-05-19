package com.mangareader.infrastructure.persistence.mongo.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("V009MigrateChaptersToCollection")
@Tag("testcontainers")
class V009MigrateChaptersToCollectionTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection("titles");
        mongoTemplate.dropCollection("chapters");
    }

    @Test
    @DisplayName("Move chapters embedded para coleção própria e faz $unset")
    void migra() {
        var titles = mongoTemplate.getCollection("titles");
        titles.insertOne(new Document("_id", "t1")
                .append("name", new Document("pt-BR", "Título 1"))
                .append("chapters", List.of(
                        new Document("number", "1")
                                .append("title", new Document("pt-BR", "Cap 1"))
                                .append("releaseDate", "2025-01-01")
                                .append("pages", "30"),
                        new Document("number", "2")
                                .append("title", new Document("pt-BR", "Cap 2"))
                                .append("releaseDate", "2025-01-08")
                                .append("pages", "28"))));
        titles.insertOne(new Document("_id", "t2")
                .append("name", new Document("pt-BR", "Título 2"))
                .append("chapters", List.of(
                        new Document("number", "1")
                                .append("title", new Document("pt-BR", "Único"))
                                .append("releaseDate", "2025-02-01")
                                .append("pages", "40"))));

        new V009MigrateChaptersToCollection(mongoTemplate).execute();

        var chapters = mongoTemplate.getCollection("chapters");
        assertThat(chapters.countDocuments()).isEqualTo(3);
        assertThat(chapters.countDocuments(new Document("titleId", "t1"))).isEqualTo(2);
        assertThat(chapters.countDocuments(new Document("titleId", "t2"))).isEqualTo(1);

        for (Document t : titles.find()) {
            assertThat(t.containsKey("chapters")).isFalse();
        }
    }

    @Test
    @DisplayName("Idempotente — reexecução não duplica")
    void idempotente() {
        var titles = mongoTemplate.getCollection("titles");
        titles.insertOne(new Document("_id", "t1")
                .append("chapters", List.of(
                        new Document("number", "1")
                                .append("title", new Document("pt-BR", "Cap 1"))
                                .append("releaseDate", "2025-01-01")
                                .append("pages", "30"))));

        var migration = new V009MigrateChaptersToCollection(mongoTemplate);
        migration.execute();
        migration.execute();

        assertThat(mongoTemplate.getCollection("chapters").countDocuments())
                .isEqualTo(1);
    }

    @Test
    @DisplayName("Loga resumo de auditoria com totais (DT-21)")
    void logaResumoAuditoria() {
        var titles = mongoTemplate.getCollection("titles");
        titles.insertOne(new Document("_id", "t1")
                .append("chapters", List.of(
                        new Document("number", "1")
                                .append("title", new Document("pt-BR", "Cap 1"))
                                .append("releaseDate", "2025-01-01")
                                .append("pages", "30"),
                        new Document("number", "2")
                                .append("title", new Document("pt-BR", "Cap 2"))
                                .append("releaseDate", "2025-01-08")
                                .append("pages", "28"))));

        var logger = (Logger) LoggerFactory.getLogger(
                V009MigrateChaptersToCollection.class);
        var appender = new ListAppender<ILoggingEvent>();
        appender.start();
        logger.addAppender(appender);

        try {
            new V009MigrateChaptersToCollection(mongoTemplate).execute();
        } finally {
            logger.detachAppender(appender);
        }

        assertThat(appender.list)
                .extracting(ILoggingEvent::getFormattedMessage)
                .anyMatch(m -> m.contains("V009 início"))
                .anyMatch(m -> m.contains(
                        "V009 fim — títulos processados=1, capítulos inseridos=2"));
    }

    @Test
    @DisplayName("Loga 'nada a migrar' quando não há títulos com chapters (DT-21)")
    void logaNadaAMigrar() {
        var logger = (Logger) LoggerFactory.getLogger(
                V009MigrateChaptersToCollection.class);
        var appender = new ListAppender<ILoggingEvent>();
        appender.start();
        logger.addAppender(appender);

        try {
            new V009MigrateChaptersToCollection(mongoTemplate).execute();
        } finally {
            logger.detachAppender(appender);
        }

        assertThat(appender.list)
                .extracting(ILoggingEvent::getFormattedMessage)
                .anyMatch(m -> m.contains("nada a migrar"));
    }

    @Test
    @DisplayName("Título sem campo chapters não é afetado nem gera capítulos")
    void semChaptersNaoAfeta() {
        var titles = mongoTemplate.getCollection("titles");
        titles.insertOne(new Document("_id", "t-sem")
                .append("name", new Document("pt-BR", "Sem capítulos")));

        new V009MigrateChaptersToCollection(mongoTemplate).execute();

        assertThat(mongoTemplate.getCollection("chapters").countDocuments())
                .isZero();
        var doc = titles.find(new Document("_id", "t-sem")).first();
        assertThat(doc).isNotNull();
        assertThat(doc.get("name")).isNotNull();
    }
}
