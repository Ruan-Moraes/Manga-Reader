package com.toonlira.infrastructure.persistence.mongo.migration;

import org.bson.Document;
import org.springframework.dao.DataAccessException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.domain.Sort;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Adds the release-feed indexes without inventing metadata for legacy chapters.
 */
@ChangeUnit(id = "V027-create-release-feed", order = "027", author = "toonlira")
public class V027CreateReleaseFeed {
    private final MongoTemplate mongo;

    public V027CreateReleaseFeed(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    @Execution
    public void execute() {
        var viewOps = mongo.indexOps("release_feed_views");
        viewOps.ensureIndex(new CompoundIndexDefinition(
                new Document("userId", 1).append("chapterId", 1))
                .unique().named("idx_release_feed_views_user_chapter"));
        viewOps.ensureIndex(new Index().on("chapterId", Sort.Direction.ASC)
                .named("idx_release_feed_views_chapter"));

        var chapterOps = mongo.indexOps("chapters");
        chapterOps.ensureIndex(new CompoundIndexDefinition(new Document("status", 1)
                .append("deletedAt", 1).append("publishedAt", -1))
                .named("idx_chapter_release_feed"));
        chapterOps.ensureIndex(new CompoundIndexDefinition(new Document("status", 1)
                .append("deletedAt", 1).append("contentLanguage", 1).append("publishedAt", -1))
                .named("idx_chapter_release_feed_language"));
    }

    @RollbackExecution
    public void rollback() {
        drop("release_feed_views", "idx_release_feed_views_user_chapter");
        drop("release_feed_views", "idx_release_feed_views_chapter");
        drop("chapters", "idx_chapter_release_feed");
        drop("chapters", "idx_chapter_release_feed_language");
    }

    private void drop(String collection, String index) {
        try {
            mongo.indexOps(collection).dropIndex(index);
        } catch (DataAccessException ignored) {
            // Safe after a partially applied migration.
        }
    }
}
