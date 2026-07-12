package com.mangareader.trending.infrastructure.migration;

import java.time.Duration;

import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.core.env.Environment;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

@ChangeUnit(id = "V001-create-trending-indexes", order = "001", author = "mangareader")
public class V001CreateTrendingIndexes {
    private final MongoTemplate mongo;
    private final Environment environment;

    public V001CreateTrendingIndexes(MongoTemplate mongo, Environment environment) {
        this.mongo = mongo;
        this.environment = environment;
    }

    @Execution
    public void execute() {
        var indexes = mongo.indexOps("title_trend_daily");
        indexes.ensureIndex(new Index().on("snapshotDate", Direction.DESC).on("scores.DAY.value", Direction.DESC).named("idx_trend_day"));
        indexes.ensureIndex(new Index().on("snapshotDate", Direction.DESC).on("scores.WEEK.value", Direction.DESC).named("idx_trend_week"));
        indexes.ensureIndex(new Index().on("snapshotDate", Direction.DESC).on("scores.MONTH.value", Direction.DESC).named("idx_trend_month"));
        long retentionDays = environment.getProperty("trending.retention-days", Long.class, 90L);
        if (retentionDays < 1) {
            throw new IllegalArgumentException("trending.retention-days must be positive");
        }
        indexes.ensureIndex(new Index().on("calculatedAt", Direction.ASC)
                .expire(Duration.ofDays(retentionDays)).named("idx_trend_retention"));
        mongo.indexOps("user_chapter_reads").ensureIndex(new Index().on("readAt", Direction.ASC).on("titleId", Direction.ASC).named("idx_reads_time_title"));
        mongo.indexOps("reviews").ensureIndex(new Index().on("createdAt", Direction.ASC).on("titleId", Direction.ASC).named("idx_reviews_time_title"));
        mongo.indexOps("comments").ensureIndex(new Index().on("targetType", Direction.ASC)
                .on("createdAt", Direction.ASC).on("targetId", Direction.ASC).named("idx_comments_type_time_target"));
        mongo.indexOps("chapters").ensureIndex(new Index().on("releaseDate", Direction.ASC).on("titleId", Direction.ASC).named("idx_chapters_release_title"));
    }

    @RollbackExecution
    public void rollback() {}
}
