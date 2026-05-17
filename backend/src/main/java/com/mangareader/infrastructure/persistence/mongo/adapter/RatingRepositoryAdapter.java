package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.infrastructure.persistence.mongo.repository.RatingMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Rating ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class RatingRepositoryAdapter implements RatingRepositoryPort {
    private final RatingMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Optional<MangaRating> findByTitleIdAndUserId(String titleId, String userId) {
        return repository.findByTitleIdAndUserId(titleId, userId);
    }

    @Override
    public Optional<MangaRating> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public MangaRating save(MangaRating rating) {
        return repository.save(rating);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public long countByTitleId(String titleId) {
        return repository.countByTitleId(titleId);
    }

    @Override
    public Page<MangaRating> findByTitleId(String titleId, Pageable pageable) {
        return repository.findByTitleId(titleId, pageable);
    }

    @Override
    public Page<MangaRating> findByUserId(String userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }

    @Override
    public long countByUserId(String userId) {
        return repository.countByUserId(userId);
    }

    @Override
    public RatingAggregate aggregateByTitleId(String titleId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").is(titleId)),
                Aggregation.group()
                        .avg("overallRating").as("average")
                        .count().as("count"));

        AggregationResults<AggDoc> results = mongoTemplate.aggregate(
                aggregation, MangaRating.class, AggDoc.class);

        AggDoc doc = results.getUniqueMappedResult();

        return doc == null
                ? new RatingAggregate(0.0, 0)
                : new RatingAggregate(doc.average(), doc.count());
    }

    private record AggDoc(double average, long count) {}
}
