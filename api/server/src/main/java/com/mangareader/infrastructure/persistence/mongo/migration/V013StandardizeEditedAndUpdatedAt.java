package com.mangareader.infrastructure.persistence.mongo.migration;

import java.util.List;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — padroniza o indicador de edição e a data de modificação
 * no UGC do Mongo (resenhas e comentários da obra), alinhando com o fórum
 * (Postgres, Flyway V32).
 *
 * <p>(1) {@code ratings}: backfill {@code edited:false} e {@code updatedAt = createdAt}
 * onde ausentes. (2) {@code comments}: renomeia {@code wasEdited} → {@code edited}
 * e backfill {@code updatedAt = createdAt} onde ausente.
 *
 * <p>Idempotente: cada passo só toca documentos que ainda não foram migrados
 * ({@code $exists}). O backfill de {@code updatedAt} usa pipeline de agregação
 * para copiar o valor de {@code createdAt}.
 */
@Slf4j
@ChangeUnit(id = "V013-standardize-edited-and-updatedAt", order = "013", author = "mangareader")
public class V013StandardizeEditedAndUpdatedAt {
    private final MongoTemplate mongoTemplate;

    public V013StandardizeEditedAndUpdatedAt(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        log.info("V013 início — padronização de edited/updatedAt em ratings e comments");

        // ratings: edited=false onde ausente
        long ratingsEdited = mongoTemplate.getCollection("ratings").updateMany(
                new Document("edited", new Document("$exists", false)),
                new Document("$set", new Document("edited", false))
        ).getModifiedCount();

        // ratings: updatedAt = createdAt onde ausente (pipeline para referenciar outro campo)
        long ratingsUpdatedAt = mongoTemplate.getCollection("ratings").updateMany(
                new Document("updatedAt", new Document("$exists", false)),
                List.of(new Document("$set", new Document("updatedAt", "$createdAt")))
        ).getModifiedCount();

        // comments: rename wasEdited -> edited
        long commentsRenamed = mongoTemplate.getCollection("comments").updateMany(
                new Document("wasEdited", new Document("$exists", true)),
                new Document("$rename", new Document("wasEdited", "edited"))
        ).getModifiedCount();

        // comments: edited=false onde ainda ausente (docs sem wasEdited prévio)
        mongoTemplate.getCollection("comments").updateMany(
                new Document("edited", new Document("$exists", false)),
                new Document("$set", new Document("edited", false))
        );

        // comments: updatedAt = createdAt onde ausente
        long commentsUpdatedAt = mongoTemplate.getCollection("comments").updateMany(
                new Document("updatedAt", new Document("$exists", false)),
                List.of(new Document("$set", new Document("updatedAt", "$createdAt")))
        ).getModifiedCount();

        log.info("V013 fim — ratings(edited={}, updatedAt={}), comments(renamed={}, updatedAt={})",
                ratingsEdited, ratingsUpdatedAt, commentsRenamed, commentsUpdatedAt);
    }

    @RollbackExecution
    public void rollback() {
        // Backfill aditivo + rename: rollback reverte o rename para não deixar estado misto.
        mongoTemplate.getCollection("comments").updateMany(
                new Document("edited", new Document("$exists", true)),
                new Document("$rename", new Document("edited", "wasEdited"))
        );
    }
}
