package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.domain.user.entity.ReadingProgress;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import({ReadingProgressRepositoryAdapter.class, MongoTestContainerConfig.class})
class ReadingProgressRepositoryAdapterTest {
    @Autowired
    private ReadingProgressRepositoryPort repository;

    @Autowired
    private MongoTemplate mongo;

    @BeforeEach
    void clean() {
        mongo.dropCollection(ReadingProgress.class);
    }

    @Test
    void upsertsByNaturalKeyInsteadOfCreatingCompetingDocuments() {
        ReadingProgress first = progress(2, false);
        ReadingProgress second = progress(9, true);

        ReadingProgress created = repository.save(first);
        ReadingProgress updated = repository.save(second);

        assertThat(updated.getId()).isEqualTo(created.getId());
        assertThat(updated.getCurrentPage()).isEqualTo(9);
        assertThat(updated.isCompleted()).isTrue();
        assertThat(mongo.count(new org.springframework.data.mongodb.core.query.Query(), ReadingProgress.class))
                .isEqualTo(1);
    }

    private static ReadingProgress progress(int page, boolean completed) {
        return ReadingProgress.builder()
                .userId("user-1")
                .titleId("title-1")
                .chapterNumber("7")
                .currentPage(page)
                .totalPages(10)
                .completed(completed)
                .build();
    }
}
