package com.toonlira.infrastructure.persistence.mongo.migration;

import static org.assertj.core.api.Assertions.assertThat;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.toonlira.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("V028CreateTitleSearchIndex (Mongock)")
@Tag("testcontainers")
class V028CreateTitleSearchIndexTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void clean() {
        mongoTemplate.dropCollection("titles");
    }

    @Test
    @DisplayName("Backfill normaliza todas as traduções e cria índice multikey")
    void backfillsLocalizedNamesAndCreatesIndex() {
        mongoTemplate.getCollection("titles").insertOne(new Document("_id", "t1")
                .append("name", new Document("values", new Document()
                        .append("pt-BR", "Ação Total")
                        .append("en-US", "Total Action")))
                .append("aliases", java.util.List.of(
                        new Document("name", "Ação Alternativa").append("type", "ALTERNATIVE"))));

        new V028CreateTitleSearchIndex(mongoTemplate).execute();

        var stored = mongoTemplate.getCollection("titles")
                .find(new Document("_id", "t1"))
                .first();
        assertThat(stored).isNotNull();
        var searchIndex = stored.get("searchIndex", Document.class);
        assertThat(searchIndex.get("normalizedNames", Document.class))
                .containsEntry("pt-BR", "acao total")
                .containsEntry("en-US", "total action");
        assertThat(searchIndex.getList("normalizedAliases", String.class))
                .containsExactly("acao alternativa");
        assertThat(searchIndex.getList("grams", String.class)).contains("ac", "to", "al");
        assertThat(mongoTemplate.indexOps("titles").getIndexInfo().stream()
                .map(index -> index.getName())
                .toList()).contains(V028CreateTitleSearchIndex.INDEX_NAME);
    }

    @Test
    @DisplayName("Rollback remove o índice e o subdocumento derivado")
    void rollsBackDerivedDataAndIndex() {
        mongoTemplate.getCollection("titles").insertOne(new Document("_id", "t1")
                .append("name", new Document("values", new Document("pt-BR", "Berserk"))));
        var migration = new V028CreateTitleSearchIndex(mongoTemplate);
        migration.execute();

        migration.rollback();

        var stored = mongoTemplate.getCollection("titles")
                .find(new Document("_id", "t1"))
                .first();
        assertThat(stored).isNotNull();
        assertThat(stored).doesNotContainKey("searchIndex");
        assertThat(mongoTemplate.indexOps("titles").getIndexInfo().stream()
                .map(index -> index.getName())
                .toList()).doesNotContain(V028CreateTitleSearchIndex.INDEX_NAME);
    }
}
