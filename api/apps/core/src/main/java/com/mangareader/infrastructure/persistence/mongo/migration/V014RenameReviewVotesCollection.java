package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;

import com.mongodb.MongoNamespace;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — padroniza a nomenclatura da coleção de votos de resenha
 * para a convenção {@code <pai>_votes}: {@code review_votes} → {@code reviews_votes}
 * (consistente com {@code comments_votes}).
 *
 * <p>O rename de coleção carrega os índices junto; o único composto
 * {@code {ratingId, userId}} (V010) é renomeado para
 * {@code idx_reviews_votes_review_user} (drop antes do create — mesmas chaves
 * com nome diferente disparam IndexOptionsConflict, erro 85).
 *
 * <p>Idempotente: rename só ocorre se origem existir e destino não; passos de
 * índice só tocam o que ainda não foi migrado.
 */
@Slf4j
@ChangeUnit(id = "V014-rename-reviews-votes-collection", order = "014", author = "mangareader")
public class V014RenameReviewVotesCollection {
    private static final String SOURCE = "review_votes";
    private static final String TARGET = "reviews_votes";

    private final MongoTemplate mongoTemplate;

    public V014RenameReviewVotesCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        if (mongoTemplate.collectionExists(SOURCE) && !mongoTemplate.collectionExists(TARGET)) {
            String db = mongoTemplate.getDb().getName();
            mongoTemplate.getCollection(SOURCE).renameCollection(new MongoNamespace(db, TARGET));
            log.info("V014 — coleção {} renomeada para {}", SOURCE, TARGET);
        } else {
            log.info("V014 — rename ignorado (source existe={}, target existe={})",
                    mongoTemplate.collectionExists(SOURCE), mongoTemplate.collectionExists(TARGET));
        }

        renameUniqueIndex();
    }

    /** Renomeia o índice único herdado (V010) para casar com a anotação de ReviewVote. */
    private void renameUniqueIndex() {
        var ops = mongoTemplate.indexOps(TARGET);

        boolean oldExists = ops.getIndexInfo().stream()
                .anyMatch(idx -> "idx_review_vote_rating_user".equals(idx.getName()));
        if (oldExists) {
            ops.dropIndex("idx_review_vote_rating_user");
        }

        var unique = new Document("ratingId", 1).append("userId", 1);
        ops.ensureIndex(new CompoundIndexDefinition(unique).unique().named("idx_reviews_votes_review_user"));
    }

    @RollbackExecution
    public void rollback() {
        if (mongoTemplate.collectionExists(TARGET) && !mongoTemplate.collectionExists(SOURCE)) {
            String db = mongoTemplate.getDb().getName();
            mongoTemplate.getCollection(TARGET).renameCollection(new MongoNamespace(db, SOURCE));
        }
    }
}
