package com.mangareader.infrastructure.persistence.mongo.migration;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Mongock ChangeUnit — cria índices iniciais das 4 coleções MongoDB.
 * <p>
 * Equivale à V1 do Flyway, mas para o lado MongoDB.
 * Os índices aqui definidos correspondem às anotações {@code @Indexed},
 * {@code @TextIndexed} e {@code @CompoundIndex} das entidades de domínio.
 */
@ChangeUnit(id = "V001-create-indexes", order = "001", author = "mangareader")
public class V001CreateIndexes {

    private final MongoTemplate mongoTemplate;

    public V001CreateIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        createTitlesIndexes();
        createCommentsIndexes();
        createRatingsIndexes();
        createNewsIndexes();
    }

    @RollbackExecution
    public void rollback() {
        dropCustomIndexes("titles");
        dropCustomIndexes("comments");
        dropCustomIndexes("ratings");
        dropCustomIndexes("news");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // titles
    // ─────────────────────────────────────────────────────────────────────────

    private void createTitlesIndexes() {
        var ops = mongoTemplate.indexOps("titles");

        // Text index: name (weight 10), author (weight 5), synopsis (weight 3)
        ops.ensureIndex(new TextIndexDefinition.TextIndexDefinitionBuilder()
                .onField("name", 10F)
                .onField("author", 5F)
                .onField("synopsis", 3F)
                .named("idx_titles_text")
                .build());

        // Single-field indexes
        ops.ensureIndex(new Index().on("genres", Sort.Direction.ASC).named("idx_titles_genres"));
        ops.ensureIndex(new Index().on("popularity", Sort.Direction.ASC).named("idx_titles_popularity"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // comments
    // ─────────────────────────────────────────────────────────────────────────

    private void createCommentsIndexes() {
        var ops = mongoTemplate.indexOps("comments");

        ops.ensureIndex(new Index().on("titleId", Sort.Direction.ASC).named("idx_comments_titleId"));
        ops.ensureIndex(new Index().on("parentCommentId", Sort.Direction.ASC).named("idx_comments_parentCommentId"));
        ops.ensureIndex(new Index().on("userId", Sort.Direction.ASC).named("idx_comments_userId"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ratings
    // ─────────────────────────────────────────────────────────────────────────

    private void createRatingsIndexes() {
        var ops = mongoTemplate.indexOps("ratings");

        ops.ensureIndex(new Index().on("titleId", Sort.Direction.ASC).named("idx_ratings_titleId"));
        ops.ensureIndex(new Index().on("userId", Sort.Direction.ASC).named("idx_ratings_userId"));

        // Compound unique index: titleId + userId
        var compoundDef = new org.bson.Document();
        compoundDef.put("titleId", 1);
        compoundDef.put("userId", 1);
        ops.ensureIndex(new CompoundIndexDefinition(compoundDef)
                .unique()
                .named("idx_rating_title_user"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // news
    // ─────────────────────────────────────────────────────────────────────────

    private void createNewsIndexes() {
        var ops = mongoTemplate.indexOps("news");

        // Text index: title (weight 10), excerpt (weight 3)
        ops.ensureIndex(new TextIndexDefinition.TextIndexDefinitionBuilder()
                .onField("title", 10F)
                .onField("excerpt", 3F)
                .named("idx_news_text")
                .build());

        // Single-field indexes
        ops.ensureIndex(new Index().on("category", Sort.Direction.ASC).named("idx_news_category"));
        ops.ensureIndex(new Index().on("tags", Sort.Direction.ASC).named("idx_news_tags"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Remove todos os índices customizados (mantém _id_ e qualquer outro interno do Mongo).
     */
    private void dropCustomIndexes(String collectionName) {
        var ops = mongoTemplate.indexOps(collectionName);
        ops.getIndexInfo().stream()
                .filter(idx -> !idx.getName().equals("_id_"))
                .forEach(idx -> ops.dropIndex(idx.getName()));
    }
}
