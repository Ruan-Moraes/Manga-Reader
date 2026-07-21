package com.mangareader.trending.infrastructure.seed;

import java.util.List;

import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.trending.application.port.TrendSnapshotPort;

@Component
@ConditionalOnProperty(name = "trending.seed.enabled", havingValue = "true")
public class TrendingSeed implements ApplicationRunner {
    private static final int DEMO_TITLE_LIMIT = 12;

    private final MongoTemplate mongo;
    private final TrendSnapshotPort snapshots;
    private final TrendingSeedDataFactory factory;

    public TrendingSeed(MongoTemplate mongo, TrendSnapshotPort snapshots, TrendingSeedDataFactory factory) {
        this.mongo = mongo;
        this.snapshots = snapshots;
        this.factory = factory;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (snapshots.hasSnapshots()) return;

        Query query = new Query()
                .with(org.springframework.data.domain.Sort.by(Direction.ASC, "createdAt"))
                .limit(DEMO_TITLE_LIMIT);
        query.fields().include("_id");
        List<String> titleIds = mongo.find(query, Document.class, "titles").stream()
                .map(document -> document.get("_id"))
                .filter(java.util.Objects::nonNull)
                .map(Object::toString)
                .toList();
        if (titleIds.isEmpty()) return;

        var calculatedAt = java.time.Instant.now();
        var snapshotDate = calculatedAt.atZone(java.time.ZoneOffset.UTC).toLocalDate();
        snapshots.replace(snapshotDate, factory.create(titleIds, calculatedAt));
    }
}
