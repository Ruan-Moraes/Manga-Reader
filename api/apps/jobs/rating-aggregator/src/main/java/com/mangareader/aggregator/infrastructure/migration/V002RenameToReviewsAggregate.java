package com.mangareader.aggregator.infrastructure.migration;

import org.springframework.data.mongodb.core.MongoTemplate;

import com.mongodb.MongoNamespace;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — acompanha a padronização do servidor (V018):
 * {@code title_rating_aggregate} → {@code reviews_aggregate}.
 * <p>
 * O servidor e o aggregator compartilham o banco mas têm changelogs próprios e
 * ordem de boot não garantida — por isso o rename idempotente existe nos DOIS
 * lados (quem chegar primeiro renomeia; o outro vira no-op), convergindo
 * inclusive em instalações novas onde o V001 deste módulo ainda cria o nome
 * antigo.
 */
@Slf4j
@ChangeUnit(id = "V002-rename-to-reviews-aggregate", order = "002", author = "mangareader")
public class V002RenameToReviewsAggregate {
    private static final String SOURCE = "title_rating_aggregate";
    private static final String TARGET = "reviews_aggregate";

    private final MongoTemplate mongoTemplate;

    public V002RenameToReviewsAggregate(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        if (mongoTemplate.collectionExists(SOURCE) && !mongoTemplate.collectionExists(TARGET)) {
            String db = mongoTemplate.getDb().getName();
            mongoTemplate.getCollection(SOURCE).renameCollection(new MongoNamespace(db, TARGET));
            log.info("V002 — coleção {} renomeada para {}", SOURCE, TARGET);
        } else {
            log.info("V002 — rename ignorado (source existe={}, target existe={})",
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
