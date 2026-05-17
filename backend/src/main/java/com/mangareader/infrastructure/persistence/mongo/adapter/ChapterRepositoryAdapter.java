package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.infrastructure.persistence.mongo.repository.ChapterMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Chapter ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ChapterRepositoryAdapter implements ChapterRepositoryPort {
    private final ChapterMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Chapter> findByTitleId(String titleId, Pageable pageable) {
        return repository.findByTitleId(titleId, pageable);
    }

    @Override
    public Optional<Chapter> findByTitleIdAndNumber(String titleId, String number) {
        return repository.findByTitleIdAndNumber(titleId, number);
    }

    @Override
    public long countByTitleId(String titleId) {
        return repository.countByTitleId(titleId);
    }

    @Override
    public Map<String, Long> countByTitleIdIn(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return Map.of();
        }

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").in(titleIds)),
                Aggregation.group("titleId").count().as("total"),
                Aggregation.project("total").and("_id").as("titleId"));

        AggregationResults<CountByTitle> results = mongoTemplate.aggregate(
                aggregation, "chapters", CountByTitle.class);

        Map<String, Long> counts = new HashMap<>();
        for (CountByTitle r : results) {
            counts.put(r.titleId(), r.total());
        }

        return counts;
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public List<Chapter> saveAll(List<Chapter> chapters) {
        return repository.saveAll(chapters);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }

    private record CountByTitle(String titleId, long total) {}
}
