package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — cria índices para a coleção reading_progress.
 * <p>
 * Único índice: composto e {@code unique} em (userId, titleId, chapterNumber).
 * Garante upsert idempotente e cobre a busca do progresso mais recente por
 * (userId, titleId) — prefixo à esquerda do composto.
 */
@ChangeUnit(id = "V021-create-reading-progress-indexes", order = "021", author = "mangareader")
public class V021CreateReadingProgressIndexes {
    private static final String INDEX_NAME = "idx_reading_progress_user_title_chapter";
    private final MongoTemplate mongoTemplate;

    public V021CreateReadingProgressIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var ops = mongoTemplate.indexOps("reading_progress");

        var uniqueCompound = new org.bson.Document();
        uniqueCompound.put("userId", 1);
        uniqueCompound.put("titleId", 1);
        uniqueCompound.put("chapterNumber", 1);

        ops.ensureIndex(new CompoundIndexDefinition(uniqueCompound)
                .unique()
                .named(INDEX_NAME));
    }

    @RollbackExecution
    public void rollback() {
        var ops = mongoTemplate.indexOps("reading_progress");

        ops.getIndexInfo().stream()
                .filter(idx -> INDEX_NAME.equals(idx.getName()))
                .findFirst()
                .ifPresent(idx -> ops.dropIndex(INDEX_NAME));
    }
}
