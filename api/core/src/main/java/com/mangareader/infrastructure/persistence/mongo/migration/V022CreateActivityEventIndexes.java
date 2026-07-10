package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — cria índice para a coleção activity_events.
 * <p>
 * Índice composto (userId, hidden, occurredAt desc) — cobre a query de
 * listagem paginada "eventos visíveis do usuário, mais recentes primeiro".
 */
@ChangeUnit(id = "V022-create-activity-event-indexes", order = "022", author = "mangareader")
public class V022CreateActivityEventIndexes {
    private final MongoTemplate mongoTemplate;

    public V022CreateActivityEventIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var ops = mongoTemplate.indexOps("activity_events");

        var compound = new org.bson.Document();
        compound.put("userId", 1);
        compound.put("hidden", 1);
        compound.put("occurredAt", -1);

        ops.ensureIndex(new CompoundIndexDefinition(compound)
                .named("idx_activity_events_user_hidden_occurred"));
    }

    @RollbackExecution
    public void rollback() {
        var ops = mongoTemplate.indexOps("activity_events");

        ops.getIndexInfo().stream()
                .filter(idx -> !idx.getName().equals("_id_"))
                .forEach(idx -> ops.dropIndex(idx.getName()));
    }
}
