package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.ConvertOperators;
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
        Sort.Direction direction = pageable.getSort().stream()
                .findFirst()
                .map(Sort.Order::getDirection)
                .orElse(Sort.Direction.ASC);

        var numericValue = ConvertOperators.Convert.convertValueOf("number")
                .to("double")
                .onErrorReturn(-1d)
                .onNullReturn(-1d);

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").is(titleId)),
                Aggregation.addFields().addField("numericValue").withValue(numericValue).build(),
                Aggregation.sort(Sort.by(direction, "numericValue").and(Sort.by(direction, "number"))),
                Aggregation.skip(pageable.getOffset()),
                Aggregation.limit(pageable.getPageSize()),
                Aggregation.project().andExclude("numericValue"));

        AggregationResults<Chapter> results = mongoTemplate.aggregate(
                aggregation, "chapters", Chapter.class);

        long total = repository.countByTitleId(titleId);

        return new PageImpl<>(results.getMappedResults(), pageable, total);
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
    public Map<String, String> latestChapterNumberByTitleIdIn(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return Map.of();
        }

        var numericValue = ConvertOperators.Convert.convertValueOf("number")
                .to("double")
                .onErrorReturn(-1d)
                .onNullReturn(-1d);

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").in(titleIds)),
                Aggregation.addFields().addField("numericValue").withValue(numericValue).build(),
                Aggregation.sort(Sort.Direction.ASC, "numericValue"),
                Aggregation.group("titleId").last("number").as("latest"),
                Aggregation.project("latest").and("_id").as("titleId"));

        AggregationResults<LatestByTitle> results = mongoTemplate.aggregate(
                aggregation, "chapters", LatestByTitle.class);

        Map<String, String> latest = new HashMap<>();

        for (LatestByTitle r : results) {
            latest.put(r.titleId(), r.latest());
        }

        return latest;
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

    private record LatestByTitle(String titleId, String latest) {}
}
