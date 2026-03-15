package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — cria índices para a coleção view_history.
 */
@ChangeUnit(id = "V002-create-view-history-indexes", order = "002", author = "mangareader")
public class V002CreateViewHistoryIndexes {
    private final MongoTemplate mongoTemplate;

    public V002CreateViewHistoryIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var ops = mongoTemplate.indexOps("view_history");

        ops.ensureIndex(new Index().on("userId", Sort.Direction.ASC).named("idx_view_history_userId"));

        var uniqueCompound = new org.bson.Document();
        uniqueCompound.put("userId", 1);
        uniqueCompound.put("titleId", 1);
        ops.ensureIndex(new CompoundIndexDefinition(uniqueCompound)
                .unique()
                .named("idx_view_history_user_title"));

        var sortCompound = new org.bson.Document();
        sortCompound.put("userId", 1);
        sortCompound.put("viewedAt", -1);
        ops.ensureIndex(new CompoundIndexDefinition(sortCompound)
                .named("idx_view_history_user_viewedAt"));
    }

    @RollbackExecution
    public void rollback() {
        var ops = mongoTemplate.indexOps("view_history");
        ops.getIndexInfo().stream()
                .filter(idx -> !idx.getName().equals("_id_"))
                .forEach(idx -> ops.dropIndex(idx.getName()));
    }
}
