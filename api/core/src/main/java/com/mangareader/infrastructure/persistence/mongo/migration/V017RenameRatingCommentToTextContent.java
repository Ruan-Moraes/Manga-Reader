package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — converge o corpo do texto da resenha para o nome
 * padrão do modelo de comentário unificado: {@code ratings.comment} →
 * {@code ratings.textContent} (mesmo nome usado em {@code comments}).
 *
 * <p>Idempotente: {@code $rename} só toca documentos que ainda têm o campo
 * antigo. Nenhum índice envolve o campo.
 */
@Slf4j
@ChangeUnit(id = "V017-rename-rating-comment-to-textcontent", order = "017", author = "mangareader")
public class V017RenameRatingCommentToTextContent {
    private final MongoTemplate mongoTemplate;

    public V017RenameRatingCommentToTextContent(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        long renamed = mongoTemplate.getCollection("ratings").updateMany(
                new Document("comment", new Document("$exists", true)),
                new Document("$rename", new Document("comment", "textContent"))).getModifiedCount();

        log.info("V017 — ratings.comment renomeado para textContent em {} documentos", renamed);
    }

    @RollbackExecution
    public void rollback() {
        mongoTemplate.getCollection("ratings").updateMany(
                new Document("textContent", new Document("$exists", true)),
                new Document("$rename", new Document("textContent", "comment")));
    }
}
