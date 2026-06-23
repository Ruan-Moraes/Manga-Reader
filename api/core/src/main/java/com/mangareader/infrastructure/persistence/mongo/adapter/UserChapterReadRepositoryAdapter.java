package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;

import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.domain.user.entity.UserChapterRead;
import com.mangareader.infrastructure.persistence.mongo.repository.UserChapterReadMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de UserChapterRead ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class UserChapterReadRepositoryAdapter implements UserChapterReadRepositoryPort {
    private final UserChapterReadMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Optional<UserChapterRead> findByUserIdAndTitleIdAndChapterNumber(String userId, String titleId, String chapterNumber) {
        return repository.findByUserIdAndTitleIdAndChapterNumber(userId, titleId, chapterNumber);
    }

    @Override
    public UserChapterRead save(UserChapterRead read) {
        return repository.save(read);
    }

    @Override
    public Map<String, Long> countByUserIdAndTitleIdIn(String userId, Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return Map.of();
        }

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").is(userId).and("titleId").in(titleIds)),
                Aggregation.group("titleId").count().as("count"),
                Aggregation.project("count").and("_id").as("titleId"));

        AggregationResults<TitleCount> results = mongoTemplate.aggregate(
                aggregation, UserChapterRead.class, TitleCount.class);

        return results.getMappedResults().stream()
                .collect(Collectors.toMap(TitleCount::titleId, TitleCount::count));
    }

    @Override
    public void deleteAllByUserId(String userId) {
        repository.deleteAllByUserId(userId);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }

    private record TitleCount(String titleId, long count) {}
}
