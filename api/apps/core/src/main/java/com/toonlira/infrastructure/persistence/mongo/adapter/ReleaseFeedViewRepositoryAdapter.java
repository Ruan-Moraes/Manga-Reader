package com.toonlira.infrastructure.persistence.mongo.adapter;

import java.time.Instant;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import com.toonlira.application.user.port.ReleaseFeedViewRepositoryPort;
import com.toonlira.infrastructure.persistence.mongo.document.ReleaseFeedViewDocument;
import com.toonlira.infrastructure.persistence.mongo.repository.ReleaseFeedViewMongoRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ReleaseFeedViewRepositoryAdapter implements ReleaseFeedViewRepositoryPort {
    private final ReleaseFeedViewMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Set<String> findSeenChapterIds(String userId, Collection<String> chapterIds) {
        if (userId == null || chapterIds == null || chapterIds.isEmpty()) return Set.of();
        return repository.findByUserIdAndChapterIdIn(userId, chapterIds).stream()
                .map(ReleaseFeedViewDocument::getChapterId)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    public void markSeen(String userId, String chapterId, Instant seenAt) {
        mongoTemplate.upsert(naturalKey(userId, chapterId),
                new Update().setOnInsert("userId", userId)
                        .setOnInsert("chapterId", chapterId)
                        .setOnInsert("seenAt", seenAt),
                ReleaseFeedViewDocument.class);
    }

    @Override
    public long markSeen(String userId, Collection<String> chapterIds, Instant seenAt) {
        if (chapterIds == null || chapterIds.isEmpty()) return 0;
        BulkOperations bulk = mongoTemplate.bulkOps(
                BulkOperations.BulkMode.UNORDERED, ReleaseFeedViewDocument.class);
        chapterIds.stream().distinct().forEach(chapterId -> bulk.upsert(
                naturalKey(userId, chapterId),
                new Update().setOnInsert("userId", userId)
                        .setOnInsert("chapterId", chapterId)
                        .setOnInsert("seenAt", seenAt)));
        var result = bulk.execute();
        return result.getInsertedCount() + result.getModifiedCount();
    }

    @Override
    public void deleteByChapterId(String chapterId) {
        repository.deleteByChapterId(chapterId);
    }

    @Override
    public void deleteAllByUserId(String userId) {
        repository.deleteAllByUserId(userId);
    }

    private static Query naturalKey(String userId, String chapterId) {
        return new Query(Criteria.where("userId").is(userId).and("chapterId").is(chapterId));
    }
}
