package com.mangareader.infrastructure.persistence.mongo.migration;

import java.time.Instant;

import org.bson.Document;
import org.springframework.dao.DataAccessException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;

import com.mongodb.client.model.IndexOptions;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

@ChangeUnit(id = "V025-add-chapter-editorial-workflow", order = "025", author = "mangahost")
public class V025AddChapterEditorialWorkflow {
    private final MongoTemplate mongo;

    public V025AddChapterEditorialWorkflow(MongoTemplate mongo) { this.mongo = mongo; }

    @Execution
    public void execute() {
        Instant migratedAt = Instant.now();
        for (Document chapter : mongo.getCollection("chapters").find()) {
            Document values = new Document();
            Instant release = parseReleaseDate(chapter.getString("releaseDate"), migratedAt);
            if (!chapter.containsKey("status")) values.put("status", "PUBLISHED");
            if (!chapter.containsKey("displayOrder")) values.put("displayOrder", 0);
            if (!chapter.containsKey("pageItems")) values.put("pageItems", java.util.List.of());
            if (!chapter.containsKey("publishedAt")) values.put("publishedAt", release);
            if (!chapter.containsKey("createdAt")) values.put("createdAt", release);
            if (!chapter.containsKey("updatedAt")) values.put("updatedAt", release);
            if (!chapter.containsKey("version")) values.put("version", 0L);
            if (!chapter.containsKey("deleted")) values.put("deleted", false);
            if (!values.isEmpty()) {
                mongo.getCollection("chapters").updateOne(new Document("_id", chapter.get("_id")), new Document("$set", values));
            }
        }

        var collection = mongo.getCollection("chapters");
        for (Document index : collection.listIndexes()) {
            if ("idx_chapter_title_number".equals(index.getString("name"))) {
                collection.dropIndex("idx_chapter_title_number");
                break;
            }
        }
        collection.createIndex(new Document("titleId", 1).append("number", 1), new IndexOptions()
                .name("idx_chapter_title_number_active").unique(true)
                .partialFilterExpression(new Document("deleted", false)));
        collection.createIndex(new Document("titleId", 1).append("deletedAt", 1).append("status", 1).append("number", 1),
                new IndexOptions().name("idx_chapter_admin_list"));
        collection.createIndex(new Document("status", 1).append("scheduledAt", 1),
                new IndexOptions().name("idx_chapter_scheduled_publication"));
    }

    private Instant parseReleaseDate(String value, Instant fallback) {
        if (value == null || value.isBlank()) return fallback;
        try { return Instant.parse(value); }
        catch (RuntimeException ignored) {
            try { return java.time.LocalDate.parse(value).atStartOfDay(java.time.ZoneOffset.UTC).toInstant(); }
            catch (RuntimeException alsoIgnored) { return fallback; }
        }
    }

    @RollbackExecution
    public void rollback() {
        dropIfExists("idx_chapter_title_number_active");
        dropIfExists("idx_chapter_admin_list");
        dropIfExists("idx_chapter_scheduled_publication");
        mongo.indexOps("chapters").ensureIndex(new CompoundIndexDefinition(
                new Document("titleId", 1).append("number", 1))
                .unique().named("idx_chapter_title_number"));
    }

    private void dropIfExists(String index) {
        try {
            mongo.indexOps("chapters").dropIndex(index);
        } catch (DataAccessException ignored) {
            // Idempotência: a execução pode ter falhado antes de criar o índice.
        }
    }
}
