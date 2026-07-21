package com.mangareader.infrastructure.persistence.mongo.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import(MongoTestContainerConfig.class)
@DisplayName("Rollback dos índices de progresso e atividade")
@Tag("testcontainers")
class BehaviorIndexRollbackTest {
    private static final String FOREIGN_INDEX = "idx_owned_by_another_migration";

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void clean() {
        mongoTemplate.dropCollection("reading_progress");
        mongoTemplate.dropCollection("activity_events");
    }

    @Test
    @DisplayName("V021 remove somente o índice criado por ela")
    void readingProgressRollbackPreservesForeignIndex() {
        var indexes = mongoTemplate.indexOps("reading_progress");
        indexes.ensureIndex(new Index().on("foreignField", Direction.ASC).named(FOREIGN_INDEX));
        var migration = new V021CreateReadingProgressIndexes(mongoTemplate);

        migration.execute();
        migration.rollback();

        assertThat(indexNames("reading_progress"))
                .contains(FOREIGN_INDEX)
                .doesNotContain("idx_reading_progress_user_title_chapter");
    }

    @Test
    @DisplayName("V022 remove somente o índice criado por ela")
    void activityEventRollbackPreservesForeignIndex() {
        var indexes = mongoTemplate.indexOps("activity_events");
        indexes.ensureIndex(new Index().on("foreignField", Direction.ASC).named(FOREIGN_INDEX));
        var migration = new V022CreateActivityEventIndexes(mongoTemplate);

        migration.execute();
        migration.rollback();

        assertThat(indexNames("activity_events"))
                .contains(FOREIGN_INDEX)
                .doesNotContain("idx_activity_events_user_hidden_occurred");
    }

    private List<String> indexNames(String collection) {
        return mongoTemplate.indexOps(collection).getIndexInfo().stream()
                .map(index -> index.getName())
                .toList();
    }
}
