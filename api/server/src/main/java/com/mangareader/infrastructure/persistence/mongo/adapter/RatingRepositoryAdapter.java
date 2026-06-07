package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
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
    public Page<MangaRating> findByTitleId(String titleId, Integer star, Pageable pageable) {
        if (star == null) {
            return repository.findByTitleId(titleId, pageable);
        }

        // Faixa equivalente a Math.round(overallRating) == star: [star-0.5, star+0.5).
        Query query = new Query(Criteria.where("titleId").is(titleId)
                .and("overallRating").gte(star - 0.5).lt(star + 0.5))
                .with(pageable);

        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), MangaRating.class);
        var content = mongoTemplate.find(query, MangaRating.class);

        return new PageImpl<>(content, pageable, total);
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

    @Override
    public RatingDistribution distributionByTitleId(String titleId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").is(titleId)),
                Aggregation.project()
                        .and(ArithmeticOperators.Round.roundValueOf("overallRating")).as("star"),
                Aggregation.group("star").count().as("count"),
                Aggregation.project("count").and("_id").as("star"));

        AggregationResults<StarBucket> results = mongoTemplate.aggregate(
                aggregation, MangaRating.class, StarBucket.class);

        long[] counts = new long[6]; // índice 1..5

        for (StarBucket bucket : results.getMappedResults()) {
            int star = (int) Math.max(1, Math.min(5, Math.round(bucket.star())));
            counts[star] += bucket.count();
        }

        return new RatingDistribution(counts[1], counts[2], counts[3], counts[4], counts[5]);
    }

    private record AggDoc(double average, long count) {}

    private record StarBucket(double star, long count) {}
}
