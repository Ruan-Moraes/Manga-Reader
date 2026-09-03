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
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.infrastructure.persistence.mongo.repository.ChapterMongoRepository;
import com.mangareader.domain.manga.valueobject.ChapterStatus;
import java.time.Instant;

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
                Aggregation.match(publicCriteria(titleId)),
                Aggregation.addFields().addField("numericValue").withValue(numericValue).build(),
                Aggregation.sort(Sort.by(direction, "numericValue").and(Sort.by(direction, "number"))),
                Aggregation.skip(pageable.getOffset()),
                Aggregation.limit(pageable.getPageSize()),
                Aggregation.project().andExclude("numericValue"));

        AggregationResults<Chapter> results = mongoTemplate.aggregate(
                aggregation, "chapters", Chapter.class);

        long total = mongoTemplate.count(new Query(publicCriteria(titleId)), Chapter.class);

        return new PageImpl<>(results.getMappedResults(), pageable, total);
    }

    @Override
    public Optional<Chapter> findByTitleIdAndNumber(String titleId, String number) {
        return Optional.ofNullable(mongoTemplate.findOne(new Query(new Criteria().andOperator(
                publicCriteria(titleId), Criteria.where("number").is(number))), Chapter.class));
    }

    @Override
    public Optional<Chapter> findAnyByTitleIdAndNumber(String titleId, String number) {
        return repository.findByTitleIdAndNumber(titleId, number);
    }

    @Override
    public long countByTitleId(String titleId) {
        return mongoTemplate.count(new Query(publicCriteria(titleId)), Chapter.class);
    }

    @Override
    public Map<String, Long> countByTitleIdIn(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return Map.of();
        }

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(publicCriteria().and("titleId").in(titleIds)),
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
                Aggregation.match(publicCriteria().and("titleId").in(titleIds)),
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
    public List<Chapter> findScheduledBefore(Instant instant) {
        Query query = new Query(Criteria.where("status").is(ChapterStatus.SCHEDULED)
                .and("scheduledAt").lte(instant)
                .and("deletedAt").is(null));
        return mongoTemplate.find(query, Chapter.class);
    }

    @Override
    public List<Chapter> findActiveByTitleId(String titleId) {
        Query query = new Query(Criteria.where("titleId").is(titleId)
                .and("deletedAt").is(null))
                .with(Sort.by(Sort.Direction.ASC, "displayOrder", "number"));
        return mongoTemplate.find(query, Chapter.class);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }

    @Override
    public Optional<Chapter> findById(String id) { return repository.findById(id); }

    @Override
    public Chapter save(Chapter chapter) { return repository.save(chapter); }

    @Override
    public boolean existsActiveByTitleIdAndNumber(String titleId, String number, String excludeId) {
        Criteria criteria = new Criteria().andOperator(Criteria.where("titleId").is(titleId),
                Criteria.where("number").is(number), Criteria.where("deleted").is(false));
        if (excludeId != null) criteria = new Criteria().andOperator(criteria, Criteria.where("_id").ne(excludeId));
        return mongoTemplate.exists(new Query(criteria), Chapter.class);
    }

    @Override
    public Page<Chapter> findAdmin(String titleId, List<ChapterStatus> statuses, String search,
            Instant publishedFrom, Instant publishedTo, boolean includeDeleted, Pageable pageable) {
        java.util.ArrayList<Criteria> conditions = new java.util.ArrayList<>();
        if (titleId != null && !titleId.isBlank()) conditions.add(Criteria.where("titleId").is(titleId));
        if (statuses != null && !statuses.isEmpty()) conditions.add(Criteria.where("status").in(statuses));
        if (publishedFrom != null) conditions.add(Criteria.where("publishedAt").gte(publishedFrom));
        if (publishedTo != null) conditions.add(Criteria.where("publishedAt").lte(publishedTo));
        if (!includeDeleted) conditions.add(Criteria.where("deletedAt").is(null));
        if (search != null && !search.isBlank()) {
            String escaped = java.util.regex.Pattern.quote(search.trim());
            conditions.add(new Criteria().orOperator(Criteria.where("number").regex(escaped, "i"), Criteria.where("title.pt-BR").regex(escaped, "i")));
        }
        Query query = new Query();
        if (!conditions.isEmpty()) query.addCriteria(new Criteria().andOperator(conditions.toArray(Criteria[]::new)));
        long total = mongoTemplate.count(query, Chapter.class);
        return new PageImpl<>(mongoTemplate.find(query.with(pageable), Chapter.class), pageable, total);
    }

    private static Criteria publicCriteria(String titleId) {
        return publicCriteria().and("titleId").is(titleId);
    }

    private static Criteria publicCriteria() {
        return new Criteria().andOperator(
                Criteria.where("status").is(ChapterStatus.PUBLISHED),
                Criteria.where("deletedAt").is(null),
                new Criteria().orOperator(Criteria.where("publishedAt").is(null), Criteria.where("publishedAt").lte(Instant.now())));
    }

    private record CountByTitle(String titleId, long total) {}

    private record LatestByTitle(String titleId, String latest) {}
}
