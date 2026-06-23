package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — cria índices para a coleção user_chapter_reads.
 * <p>
 * Único índice: composto e {@code unique} em (userId, titleId, chapterNumber).
 * Garante idempotência da leitura (upsert) e cobre a contagem por (userId,
 * titleId) — prefixo à esquerda do composto, sem precisar de índice extra.
 */
@ChangeUnit(id = "V020-create-user-chapter-reads-indexes", order = "020", author = "mangareader")
public class V020CreateUserChapterReadsIndexes {
    private final MongoTemplate mongoTemplate;

    public V020CreateUserChapterReadsIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        var ops = mongoTemplate.indexOps("user_chapter_reads");

        var uniqueCompound = new org.bson.Document();
        uniqueCompound.put("userId", 1);
        uniqueCompound.put("titleId", 1);
        uniqueCompound.put("chapterNumber", 1);

        ops.ensureIndex(new CompoundIndexDefinition(uniqueCompound)
                .unique()
                .named("idx_user_chapter_reads_user_title_chapter"));
    }

    @RollbackExecution
    public void rollback() {
        var ops = mongoTemplate.indexOps("user_chapter_reads");

        ops.getIndexInfo().stream()
                .filter(idx -> !idx.getName().equals("_id_"))
                .forEach(idx -> ops.dropIndex(idx.getName()));
    }
}
