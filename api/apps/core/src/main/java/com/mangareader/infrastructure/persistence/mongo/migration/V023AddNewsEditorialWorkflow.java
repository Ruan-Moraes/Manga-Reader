package com.mangareader.infrastructure.persistence.mongo.migration;

import java.time.Instant;
import java.util.HashSet;

import org.bson.Document;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import com.mangareader.domain.news.valueobject.NewsSlug;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/** Backfill forward-only do workflow editorial e índices das consultas de news. */
@ChangeUnit(id = "V023-add-news-editorial-workflow", order = "023", author = "mangareader")
public class V023AddNewsEditorialWorkflow {
    private static final String COLLECTION = "news";
    private final MongoTemplate mongoTemplate;

    public V023AddNewsEditorialWorkflow(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        Instant now = Instant.now();
        mongoTemplate.updateMulti(new Query(Criteria.where("status").exists(false)),
                new Update().set("status", "PUBLISHED"), COLLECTION);
        backfillAuditDates(now);
        backfillSlugs();
        replaceIndexes();
    }

    @RollbackExecution
    public void rollback() {
        for (String index : new String[]{"uk_news_slug", "idx_news_status_published",
                "idx_news_status_category_published", "idx_news_status_views",
                "idx_news_status_trending", "idx_news_status_scheduled", "idx_news_status_tags"}) {
            dropIfExists(index);
        }
        dropIfExists("idx_news_text");
        var ops = mongoTemplate.indexOps(COLLECTION);
        ops.ensureIndex(new TextIndexDefinition.TextIndexDefinitionBuilder()
                .onField("title", 10F).onField("excerpt", 3F)
                .named("idx_news_text").build());
        ops.ensureIndex(new Index().on("category", Sort.Direction.ASC).named("idx_news_category"));
        ops.ensureIndex(new Index().on("tags", Sort.Direction.ASC).named("idx_news_tags"));
        ops.ensureIndex(new Index().on("publishedAt", Sort.Direction.DESC).named("idx_news_publishedAt"));
    }

    private void backfillSlugs() {
        var used = new HashSet<String>();
        mongoTemplate.getCollection(COLLECTION).find().sort(new Document("_id", 1)).forEach(document -> {
            String existing = document.getString("slug");
            String base = existing == null || existing.isBlank()
                    ? NewsSlug.from(readDefaultTitle(document)) : NewsSlug.from(existing);
            String slug = base;
            int suffix = 2;
            while (!used.add(slug)) slug = base + "-" + suffix++;
            if (!slug.equals(existing)) {
                mongoTemplate.getCollection(COLLECTION)
                        .updateOne(new Document("_id", document.get("_id")),
                                new Document("$set", new Document("slug", slug)));
            }
        });
    }

    private void backfillAuditDates(Instant fallback) {
        mongoTemplate.getCollection(COLLECTION).find().forEach(document -> {
            Object publishedAt = document.get("publishedAt");
            var values = new Document();
            if (publishedAt == null && "PUBLISHED".equals(document.getString("status"))) {
                publishedAt = fallback;
                values.put("publishedAt", fallback);
            }
            if (!document.containsKey("createdAt")) values.put("createdAt", publishedAt == null ? fallback : publishedAt);
            if (!document.containsKey("updatedAt")) values.put("updatedAt", publishedAt == null ? fallback : publishedAt);
            if (!values.isEmpty()) {
                mongoTemplate.getCollection(COLLECTION).updateOne(
                        new Document("_id", document.get("_id")), new Document("$set", values));
            }
        });
    }

    @SuppressWarnings("unchecked")
    private static String readDefaultTitle(Document document) {
        Object title = document.get("title");
        if (title instanceof String value) return value;
        if (title instanceof Document localized) {
            return localized.getString("pt-BR");
        }
        return "noticia-" + document.get("_id");
    }

    private void replaceIndexes() {
        dropIfExists("idx_news_text");
        dropIfExists("idx_news_category");
        dropIfExists("idx_news_tags");
        dropIfExists("idx_news_publishedAt");

        var ops = mongoTemplate.indexOps(COLLECTION);
        ops.ensureIndex(new Index().on("slug", Sort.Direction.ASC).unique().named("uk_news_slug"));
        ensureCompound("idx_news_status_published", new Document("status", 1).append("publishedAt", -1));
        ensureCompound("idx_news_status_category_published",
                new Document("status", 1).append("category", 1).append("publishedAt", -1));
        ensureCompound("idx_news_status_views", new Document("status", 1).append("views", -1));
        ensureCompound("idx_news_status_trending", new Document("status", 1).append("trendingScore", -1));
        ensureCompound("idx_news_status_scheduled", new Document("status", 1).append("scheduledAt", 1));
        ensureCompound("idx_news_status_tags", new Document("status", 1).append("tags", 1).append("publishedAt", -1));
        ops.ensureIndex(new TextIndexDefinition.TextIndexDefinitionBuilder()
                .onField("title.pt-BR", 10F).onField("title.en-US", 10F)
                .onField("title.es-ES", 10F).onField("excerpt.pt-BR", 3F)
                .onField("excerpt.en-US", 3F).onField("excerpt.es-ES", 3F)
                .onField("tags", 2F).named("idx_news_text").build());
    }

    private void ensureCompound(String name, Document keys) {
        mongoTemplate.indexOps(COLLECTION).ensureIndex(new CompoundIndexDefinition(keys).named(name));
    }

    private void dropIfExists(String index) {
        try {
            mongoTemplate.indexOps(COLLECTION).dropIndex(index);
        } catch (DataAccessException ignored) {
            // Idempotência: índice pode não existir em instalações novas.
        }
    }
}
