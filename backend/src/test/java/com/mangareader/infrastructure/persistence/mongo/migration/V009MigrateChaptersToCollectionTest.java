package com.mangareader.infrastructure.persistence.mongo.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("V009MigrateChaptersToCollection")
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
}
