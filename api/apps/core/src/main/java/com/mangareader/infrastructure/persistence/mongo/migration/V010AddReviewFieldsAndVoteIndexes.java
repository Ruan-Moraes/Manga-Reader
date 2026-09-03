package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.dao.DataAccessException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — DT-45: campos avançados de resenha + votação.
 *
 * <p>(1) Backfill dos defaults nos documentos {@code ratings} existentes
 * ({@code spoiler:false, top:false, upvotes:0, downvotes:0}) que ainda não os
 * têm. (2) Índice único {@code (ratingId, userId)} em {@code review_votes}
 * (1 voto por usuário por resenha).
 *
 * <p>Idempotente: o backfill só toca documentos sem o campo
 * ({@code $exists:false}); {@code ensureIndex} é no-op se o índice já existe.
 */
@Slf4j
@ChangeUnit(id = "V010-review-fields-and-vote-indexes", order = "010", author = "mangareader")
public class V010AddReviewFieldsAndVoteIndexes {
    private final MongoTemplate mongoTemplate;

    public V010AddReviewFieldsAndVoteIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        log.info("V010 início — backfill de campos de resenha + índice de votos");

        long updated = mongoTemplate.getCollection("ratings").updateMany(
                new Document("spoiler", new Document("$exists", false)),
                new Document("$set", new Document("spoiler", false)
                        .append("top", false)
                        .append("upvotes", 0L)
                        .append("downvotes", 0L))
        ).getModifiedCount();

        var compound = new Document("ratingId", 1).append("userId", 1);
        mongoTemplate.indexOps("review_votes").ensureIndex(
                new CompoundIndexDefinition(compound)
                        .unique()
                        .named("idx_review_vote_rating_user"));

        log.info("V010 fim — ratings backfilled={}", updated);
    }

    @RollbackExecution
    public void rollback() {
        try {
            mongoTemplate.indexOps("review_votes").dropIndex("idx_review_vote_rating_user");
        } catch (DataAccessException ignored) {
            // Idempotente — índice já removido ou inexistente.
        }
    }
}
