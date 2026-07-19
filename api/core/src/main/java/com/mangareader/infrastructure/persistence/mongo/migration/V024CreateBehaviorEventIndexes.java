package com.mangareader.infrastructure.persistence.mongo.migration;

import java.time.Duration;

import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

@ChangeUnit(id = "V024-create-behavior-event-indexes", order = "024", author = "mangareader")
public class V024CreateBehaviorEventIndexes {
    private static final String COLLECTION = "behavior_events";
    private final MongoTemplate mongoTemplate;

    public V024CreateBehaviorEventIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var indexes = mongoTemplate.indexOps(COLLECTION);
        indexes.ensureIndex(new Index().on("userId", Direction.ASC).on("occurredAt", Direction.DESC)
                .named("idx_behavior_user_occurred"));
        indexes.ensureIndex(new Index().on("type", Direction.ASC).on("occurredAt", Direction.DESC)
                .named("idx_behavior_type_occurred"));
        indexes.ensureIndex(new Index().on("titleId", Direction.ASC).on("type", Direction.ASC)
                .on("occurredAt", Direction.DESC).named("idx_behavior_title_type_occurred"));
        indexes.ensureIndex(new Index().on("sessionId", Direction.ASC).on("type", Direction.ASC)
                .on("occurredAt", Direction.DESC).named("idx_behavior_session_type_occurred"));
        indexes.ensureIndex(new Index().on("expiresAt", Direction.ASC).expire(Duration.ZERO)
                .named("idx_behavior_expires_ttl"));
    }

    @RollbackExecution
    public void rollback() {
        var indexes = mongoTemplate.indexOps(COLLECTION);
        indexes.dropIndex("idx_behavior_user_occurred");
        indexes.dropIndex("idx_behavior_type_occurred");
        indexes.dropIndex("idx_behavior_title_type_occurred");
        indexes.dropIndex("idx_behavior_session_type_occurred");
        indexes.dropIndex("idx_behavior_expires_ttl");
    }
}
