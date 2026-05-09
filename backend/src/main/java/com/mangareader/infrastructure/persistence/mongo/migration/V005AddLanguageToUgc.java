package com.mangareader.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Etapa 2 (i18n) — UGC particionado por idioma (MongoDB).
 *
 * <p>Adiciona campo {@code language} (BCP 47 tag) em {@code comments} e
 * {@code ratings}. Documentos existentes recebem {@code "pt-BR"} como
 * default. Listagens públicas filtram por esse campo para evitar
 * contaminação cross-language.
 */
@ChangeUnit(id = "V005-add-language-to-ugc", order = "005", author = "mangareader")
public class V005AddLanguageToUgc {

    private static final String DEFAULT_TAG = "pt-BR";

    private final MongoTemplate mongoTemplate;

    public V005AddLanguageToUgc(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        backfillLanguage("comments");
        backfillLanguage("ratings");

        mongoTemplate.indexOps("comments")
                .ensureIndex(new Index().on("language", Sort.Direction.ASC)
                        .named("idx_comments_language"));
        mongoTemplate.indexOps("ratings")
                .ensureIndex(new Index().on("language", Sort.Direction.ASC)
                        .named("idx_ratings_language"));
    }

    @RollbackExecution
    public void rollback() {
        unsetLanguage("comments");
        unsetLanguage("ratings");
        dropIndexIfExists("comments", "idx_comments_language");
        dropIndexIfExists("ratings", "idx_ratings_language");
    }

    private void backfillLanguage(String collection) {
        mongoTemplate.getCollection(collection).updateMany(
                new Document("language", new Document("$exists", false)),
                new Document("$set", new Document("language", DEFAULT_TAG)));
    }

    private void unsetLanguage(String collection) {
        mongoTemplate.getCollection(collection).updateMany(
                new Document(),
                new Document("$unset", new Document("language", "")));
    }

    private void dropIndexIfExists(String collection, String indexName) {
        var ops = mongoTemplate.indexOps(collection);
        ops.getIndexInfo().stream()
                .filter(idx -> idx.getName().equals(indexName))
                .findFirst()
                .ifPresent(idx -> ops.dropIndex(indexName));
    }
}
