package com.mangareader.infrastructure.persistence.mongo.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.stream.Collectors;

import org.bson.Document;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@Tag("testcontainers")
class EditorialMigrationRollbackTest {
    @Autowired
    private MongoTemplate mongo;

    @Test
    void newsRollbackRestoresReplacedIndexesAndPreservesForeignIndex() {
        mongo.dropCollection("news");
        var indexes = mongo.indexOps("news");
        indexes.ensureIndex(new Index().on("category", Sort.Direction.ASC).named("idx_news_category"));
        indexes.ensureIndex(new Index().on("tags", Sort.Direction.ASC).named("idx_news_tags"));
        indexes.ensureIndex(new Index().on("publishedAt", Sort.Direction.DESC).named("idx_news_publishedAt"));
        indexes.ensureIndex(new Index().on("source", Sort.Direction.ASC).named("idx_news_foreign"));
        var migration = new V023AddNewsEditorialWorkflow(mongo);

        migration.execute();
        migration.rollback();

        assertThat(indexNames("news")).contains("idx_news_text", "idx_news_category", "idx_news_tags",
                "idx_news_publishedAt", "idx_news_foreign")
                .doesNotContain("uk_news_slug", "idx_news_status_published", "idx_news_status_scheduled");
    }

    @Test
    void chapterRollbackRestoresLegacyUniqueIndexAndPreservesForeignIndex() {
        mongo.dropCollection("chapters");
        var indexes = mongo.indexOps("chapters");
        indexes.ensureIndex(new CompoundIndexDefinition(new Document("titleId", 1).append("number", 1))
                .unique().named("idx_chapter_title_number"));
        indexes.ensureIndex(new Index().on("releaseDate", Sort.Direction.ASC).named("idx_chapter_foreign"));
        var migration = new V025AddChapterEditorialWorkflow(mongo);

        migration.execute();
        migration.rollback();

        assertThat(indexNames("chapters")).contains("idx_chapter_title_number", "idx_chapter_foreign")
                .doesNotContain("idx_chapter_title_number_active", "idx_chapter_admin_list",
                        "idx_chapter_scheduled_publication");
    }

    private Set<String> indexNames(String collection) {
        return mongo.indexOps(collection).getIndexInfo().stream()
                .map(info -> info.getName())
                .collect(Collectors.toSet());
    }
}
