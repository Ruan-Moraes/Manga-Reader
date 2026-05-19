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
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("V004LocalizeCatalogContent (Mongock)")
@Tag("testcontainers")
class V004LocalizeCatalogContentTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void clean() {
        mongoTemplate.dropCollection("titles");
        mongoTemplate.dropCollection("news");
    }

    @Test
    @DisplayName("Backfill copia name → nameI18n.pt-BR e synopsis → synopsisI18n.pt-BR em titles")
    void backfillTitles() {
        mongoTemplate.getCollection("titles").insertOne(new Document()
                .append("_id", "t1")
                .append("name", "Solo Leveling")
                .append("synopsis", "Caçadores"));

        new V004LocalizeCatalogContent(mongoTemplate).execute();

        Document t = mongoTemplate.getCollection("titles")
                .find(new Document("_id", "t1")).first();
        assertThat(t).isNotNull();
        assertThat(((Document) t.get("nameI18n")).get("pt-BR")).isEqualTo("Solo Leveling");
        assertThat(((Document) t.get("synopsisI18n")).get("pt-BR")).isEqualTo("Caçadores");
    }

    @Test
    @DisplayName("Backfill em news inclui content[] como array em contentI18n.pt-BR")
    void backfillNews() {
        mongoTemplate.getCollection("news").insertOne(new Document()
                .append("_id", "n1")
                .append("title", "Notícia")
                .append("content", List.of("Para 1", "Para 2")));

        new V004LocalizeCatalogContent(mongoTemplate).execute();

        Document n = mongoTemplate.getCollection("news")
                .find(new Document("_id", "n1")).first();
        assertThat(n).isNotNull();
        assertThat(((Document) n.get("titleI18n")).get("pt-BR")).isEqualTo("Notícia");
        @SuppressWarnings("unchecked")
        List<String> content = (List<String>) ((Document) n.get("contentI18n")).get("pt-BR");
        assertThat(content).containsExactly("Para 1", "Para 2");
    }

    @Test
    @DisplayName("Cria índices compostos por idioma em titles")
    void createsLanguageIndexes() {
        new V004LocalizeCatalogContent(mongoTemplate).execute();

        var indexes = mongoTemplate.indexOps("titles").getIndexInfo().stream()
                .map(idx -> idx.getName())
                .toList();

        assertThat(indexes).contains("idx_titles_name_ptBR", "idx_titles_name_enUS", "idx_titles_name_esES");
    }
}
