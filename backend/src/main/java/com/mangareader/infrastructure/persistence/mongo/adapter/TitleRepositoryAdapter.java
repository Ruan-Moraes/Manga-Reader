package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.UnwindOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port {@link TitleRepositoryPort} ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class TitleRepositoryAdapter implements TitleRepositoryPort {
    private final TitleMongoRepository mongoRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public List<Title> findAll() {
        return mongoRepository.findAll();
    }

    @Override
    public Optional<Title> findById(String id) {
        return mongoRepository.findById(id);
    }

    @Override
    public List<Title> findByGenresContaining(String genre) {
        return mongoRepository.findByGenresContaining(genre);
    }

    @Override
    public List<Title> searchByName(String query) {
        return mongoRepository.findByNameContainingIgnoreCase(query);
    }

    @Override
    public List<Title> findByGenresContainingAll(List<String> genres) {
        return mongoRepository.findByGenresContainingAll(genres);
    }

    @Override
    public List<Title> findByFilters(List<String> genres, String status, Boolean adult) {
        List<Criteria> conditions = new ArrayList<>();

        if (genres != null && !genres.isEmpty()) {
            conditions.add(Criteria.where("genres").all(genres));
        }

        if (status != null && !"ALL".equalsIgnoreCase(status)) {
            conditions.add(Criteria.where("status").is(status.toUpperCase()));
        }

        if (adult != null) {
            conditions.add(Criteria.where("adult").is(adult));
        }

        Query query = new Query();

        if (!conditions.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(conditions.toArray(new Criteria[0])));
        }

        return mongoTemplate.find(query, Title.class);
    }

    @Override
    public Title save(Title title) {
        return mongoRepository.save(title);
    }

    @Override
    public void deleteById(String id) {
        mongoRepository.deleteById(id);
    }

    @Override
    public Page<Title> findAll(Pageable pageable) {
        return mongoRepository.findAll(pageable);
    }

    @Override
    public Page<Title> findByGenresContaining(String genre, Pageable pageable) {
        return mongoRepository.findByGenresContaining(genre, pageable);
    }

    @Override
    public Page<Title> searchByName(String query, Pageable pageable) {
        return mongoRepository.findByNameContainingIgnoreCase(query, pageable);
    }

    @Override
    public Page<Title> findByGenresContainingAll(List<String> genres, Pageable pageable) {
        return mongoRepository.findByGenresContainingAll(genres, pageable);
    }

    @Override
    public long count() {
        return mongoRepository.count();
    }

    @Override
    public long countByStatus(String status) {
        Query query = new Query(Criteria.where("status").is(status));

        return mongoTemplate.count(query, Title.class);
    }

    @Override
    public List<Title> findTopByRankingScore(int limit) {
        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "rankingScore"))
                .limit(limit);

        return mongoTemplate.find(query, Title.class);
    }

    @Override
    public long countTotalChapters() {
        UnwindOperation unwind = Aggregation.unwind("chapters", true);
        GroupOperation group = Aggregation.group().count().as("total");
        Aggregation aggregation = Aggregation.newAggregation(unwind, group);

        AggregationResults<ChapterCountResult> results =
                mongoTemplate.aggregate(aggregation, "titles", ChapterCountResult.class);

        ChapterCountResult result = results.getUniqueMappedResult();

        return result != null ? result.total() : 0L;
    }

    private record ChapterCountResult(long total) {}
}
