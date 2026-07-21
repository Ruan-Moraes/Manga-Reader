package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

@ChangeUnit(id = "V026-create-chapter-analytics-indexes", order = "026", author = "mangareader")
public class V026CreateChapterAnalyticsIndexes {
    private final MongoTemplate mongo;
    public V026CreateChapterAnalyticsIndexes(MongoTemplate mongo) { this.mongo = mongo; }

    @Execution
    public void execute() {
        mongo.indexOps("user_chapter_reads").ensureIndex(new Index().on("titleId", Direction.ASC)
                .on("chapterNumber", Direction.ASC).on("readAt", Direction.DESC)
                .named("idx_chapter_reads_title_chapter_time"));
        mongo.indexOps("behavior_events").ensureIndex(new Index().on("titleId", Direction.ASC)
                .on("chapterNumber", Direction.ASC).on("type", Direction.ASC).on("occurredAt", Direction.DESC)
                .named("idx_behavior_chapter_type_occurred"));
    }

    @RollbackExecution
    public void rollback() {
        mongo.indexOps("user_chapter_reads").dropIndex("idx_chapter_reads_title_chapter_time");
        mongo.indexOps("behavior_events").dropIndex("idx_behavior_chapter_type_occurred");
    }
}
