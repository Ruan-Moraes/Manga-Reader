package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;

import org.springframework.data.mongodb.BulkOperationException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.BulkOperations.BulkMode;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.mangareader.application.analytics.port.BehaviorEventRepositoryPort;
import com.mangareader.domain.analytics.entity.BehaviorEvent;
import com.mangareader.infrastructure.persistence.mongo.document.BehaviorEventDocument;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class BehaviorEventRepositoryAdapter implements BehaviorEventRepositoryPort {
    private final MongoTemplate mongoTemplate;

    @Override
    public void insertIgnoringDuplicates(List<BehaviorEvent> events) {
        if (events.isEmpty()) {
            return;
        }
        try {
            mongoTemplate.bulkOps(BulkMode.UNORDERED, BehaviorEventDocument.class)
                    .insert(events.stream().map(this::toDocument).toList())
                    .execute();
        } catch (BulkOperationException error) {
            boolean duplicatesOnly = error.getErrors().stream().allMatch(writeError -> writeError.getCode() == 11000);
            if (!duplicatesOnly) {
                throw error;
            }
        }
    }

    @Override
    public void deleteAllByUserId(String userId) {
        mongoTemplate.remove(Query.query(Criteria.where("userId").is(userId)),
                BehaviorEventDocument.class);
    }

    @Override
    public List<BehaviorEvent> findAllByUserId(String userId) {
        var query = Query.query(Criteria.where("userId").is(userId));
        query.with(Sort.by(Sort.Direction.ASC, "occurredAt"));
        return mongoTemplate.find(query, BehaviorEventDocument.class).stream().map(this::toDomain).toList();
    }

    private BehaviorEventDocument toDocument(BehaviorEvent e) {
        return new BehaviorEventDocument(e.eventId(), e.schemaVersion(), e.type(), e.userId(), e.sessionId(),
                e.occurredAt(), e.receivedAt(), e.expiresAt(), e.platform(), e.appVersion(), e.source(),
                e.titleId(), e.chapterNumber(), e.dwellMillis(), e.progressPercent(), e.searchTerm(),
                e.resultCount(), e.dedupeKey());
    }

    private BehaviorEvent toDomain(BehaviorEventDocument e) {
        return new BehaviorEvent(e.id(), e.schemaVersion(), e.type(), e.userId(), e.sessionId(),
                e.occurredAt(), e.receivedAt(), e.expiresAt(), e.platform(), e.appVersion(), e.source(),
                e.titleId(), e.chapterNumber(), e.dwellMillis(), e.progressPercent(), e.searchTerm(),
                e.resultCount(), e.dedupeKey());
    }
}
