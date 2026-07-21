package com.mangareader.trending.infrastructure.migration;

import java.util.concurrent.TimeUnit;
import java.util.stream.StreamSupport;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.mangareader.trending.config.TrendingProperties;
import com.mongodb.client.model.IndexOptions;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

/**
 * Reconcilia índices pelo contrato completo (nome, ordem das chaves e TTL).
 * Índices divergentes são substituídos sem tocar nos documentos da coleção.
 */
@ChangeUnit(id = "V003-reconcile-trending-indexes", order = "003", author = "mangareader")
public class V003ReconcileTrendingIndexes {
    private final MongoTemplate mongo;
    private final TrendingProperties properties;

    public V003ReconcileTrendingIndexes(MongoTemplate mongo, TrendingProperties properties) {
        this.mongo = mongo;
        this.properties = properties;
    }

    @Execution
    public void execute() {
        ensure("title_trend_daily", "idx_trend_day",
                new Document("snapshotDate", -1).append("scores.DAY.value", -1), null);
        ensure("title_trend_daily", "idx_trend_week",
                new Document("snapshotDate", -1).append("scores.WEEK.value", -1), null);
        ensure("title_trend_daily", "idx_trend_month",
                new Document("snapshotDate", -1).append("scores.MONTH.value", -1), null);
        ensure("title_trend_daily", "idx_trend_retention", new Document("calculatedAt", 1),
                TimeUnit.DAYS.toSeconds(properties.retentionDays()));

        for (String window : java.util.List.of("DAY", "WEEK", "MONTH")) {
            for (String metric : java.util.List.of("reads", "reviews", "libraryAdds")) {
                ensure("title_trend_daily",
                        "idx_trend_" + window.toLowerCase() + "_" + metric.toLowerCase(),
                        new Document("snapshotDate", -1)
                                .append("scores." + window + ".metrics." + metric, -1), null);
            }
        }

        ensure("user_chapter_reads", "idx_reads_time_title",
                new Document("readAt", 1).append("titleId", 1), null);
        ensure("reviews", "idx_reviews_time_title",
                new Document("createdAt", 1).append("titleId", 1), null);
        ensure("comments", "idx_comments_type_time_target",
                new Document("targetType", 1).append("createdAt", 1).append("targetId", 1), null);
        ensure("chapters", "idx_chapters_release_title",
                new Document("releaseDate", 1).append("titleId", 1), null);
    }

    private void ensure(String collectionName, String indexName, Document keys, Long ttlSeconds) {
        var collection = mongo.getCollection(collectionName);
        var existing = StreamSupport.stream(collection.listIndexes().spliterator(), false)
                .filter(index -> indexName.equals(index.getString("name")))
                .findFirst();

        if (existing.isPresent() && matches(existing.get(), keys, ttlSeconds)) {
            return;
        }
        existing.ifPresent(index -> collection.dropIndex(indexName));

        var options = new IndexOptions().name(indexName);
        if (ttlSeconds != null) options.expireAfter(ttlSeconds, TimeUnit.SECONDS);
        collection.createIndex(keys, options);
    }

    private boolean matches(Document existing, Document keys, Long ttlSeconds) {
        if (!keys.equals(existing.get("key", Document.class))) return false;
        Object configuredTtl = existing.get("expireAfterSeconds");
        if (ttlSeconds == null) return configuredTtl == null;
        return configuredTtl instanceof Number number && number.longValue() == ttlSeconds;
    }

    @RollbackExecution
    public void rollback() {}
}
