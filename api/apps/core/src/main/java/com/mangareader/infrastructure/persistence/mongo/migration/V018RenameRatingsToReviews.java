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
 * Mongock ChangeUnit — fecha a convenção de nomenclatura do domínio de
 * resenhas: {@code ratings} → {@code reviews} e
 * {@code title_rating_aggregate} → {@code reviews_aggregate}
 * (alinhado a {@code reviews_votes}, V014).
 *
 * <p>O rename de coleção carrega os índices junto; o único composto
 * {@code {titleId, userId}} é renomeado para {@code idx_reviews_title_user}
 * (drop antes do create — mesmas chaves com nome diferente disparam
 * IndexOptionsConflict, erro 85). Índices simples herdados de V001
 * ({@code idx_ratings_titleId}/{@code idx_ratings_userId}) são renomeados
 * pela mesma técnica.
 *
 * <p>Idempotente: renames só ocorrem se origem existir e destino não.
 */
@Slf4j
@ChangeUnit(id = "V018-rename-ratings-to-reviews", order = "018", author = "mangareader")
public class V018RenameRatingsToReviews {
    private final MongoTemplate mongoTemplate;

    public V018RenameRatingsToReviews(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        renameCollection("ratings", "reviews");
        renameCollection("title_rating_aggregate", "reviews_aggregate");

        renameIndexes();
    }

    private void renameIndexes() {
        var ops = mongoTemplate.indexOps("reviews");

        dropIndexIfExists("reviews", "idx_rating_title_user");
        ops.ensureIndex(new CompoundIndexDefinition(new Document("titleId", 1).append("userId", 1))
                .unique().named("idx_reviews_title_user"));

        dropIndexIfExists("reviews", "idx_ratings_titleId");
        ops.ensureIndex(new CompoundIndexDefinition(new Document("titleId", 1)).named("idx_reviews_titleId"));

        dropIndexIfExists("reviews", "idx_ratings_userId");
        ops.ensureIndex(new CompoundIndexDefinition(new Document("userId", 1)).named("idx_reviews_userId"));
    }

    private void renameCollection(String source, String target) {
        if (mongoTemplate.collectionExists(source) && !mongoTemplate.collectionExists(target)) {
            String db = mongoTemplate.getDb().getName();
            mongoTemplate.getCollection(source).renameCollection(new MongoNamespace(db, target));
            log.info("V018 — coleção {} renomeada para {}", source, target);
        } else {
            log.info("V018 — rename {} -> {} ignorado (source existe={}, target existe={})",
                    source, target, mongoTemplate.collectionExists(source), mongoTemplate.collectionExists(target));
        }
    }

    private void dropIndexIfExists(String collection, String indexName) {
        var ops = mongoTemplate.indexOps(collection);
        boolean exists = ops.getIndexInfo().stream().anyMatch(idx -> indexName.equals(idx.getName()));

        if (exists) {
            ops.dropIndex(indexName);
        }
    }

    @RollbackExecution
    public void rollback() {
        if (mongoTemplate.collectionExists("reviews") && !mongoTemplate.collectionExists("ratings")) {
            String db = mongoTemplate.getDb().getName();
            mongoTemplate.getCollection("reviews").renameCollection(new MongoNamespace(db, "ratings"));
        }
        if (mongoTemplate.collectionExists("reviews_aggregate") && !mongoTemplate.collectionExists("title_rating_aggregate")) {
            String db = mongoTemplate.getDb().getName();
            mongoTemplate.getCollection("reviews_aggregate")
                    .renameCollection(new MongoNamespace(db, "title_rating_aggregate"));
        }
    }
}
