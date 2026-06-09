package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.mongodb.core.MongoTemplate;

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
 * <p>Idempotente: só renomeia se a coleção de origem existir e a de destino não.
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
    }

    @RollbackExecution
    public void rollback() {
        if (mongoTemplate.collectionExists(TARGET) && !mongoTemplate.collectionExists(SOURCE)) {
            String db = mongoTemplate.getDb().getName();
            mongoTemplate.getCollection(TARGET).renameCollection(new MongoNamespace(db, SOURCE));
        }
    }
}
