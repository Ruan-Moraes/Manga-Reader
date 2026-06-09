package com.mangareader.aggregator.infrastructure.repository;

import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Leitura agregada da coleção {@code ratings} (escrita pelo monolito).
 * <p>
 * Espelha as agregações do {@code RatingRepositoryAdapter} do api/server
 * (média/contagem + distribuição por {@code Round(overallRating)}). Apps
 * independentes — sem jar compartilhado.
 */
@Component
@RequiredArgsConstructor
public class RatingAggregationDao {
    private static final String RATINGS_COLLECTION = "ratings";

    private final MongoTemplate mongoTemplate;

    /**
     * Média ({@code overallRating}), contagem e distribuição por estrela (1–5)
     * de um título, computadas no banco.
     */
    public RatingStats aggregate(String titleId) {
        Aggregation avgAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").is(titleId)),
                Aggregation.group()
                        .avg("overallRating").as("average")
                        .count().as("count"));

        AggregationResults<AvgDoc> avgResults = mongoTemplate.aggregate(
                avgAgg, RATINGS_COLLECTION, AvgDoc.class);

        AvgDoc avg = avgResults.getUniqueMappedResult();

        if (avg == null || avg.count() == 0) {
            return RatingStats.empty();
        }

        long[] buckets = distribution(titleId);

        return new RatingStats(avg.average(), avg.count(),
                buckets[1], buckets[2], buckets[3], buckets[4], buckets[5]);
    }

    private long[] distribution(String titleId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").is(titleId)),
                Aggregation.project()
                        .and(ArithmeticOperators.Round.roundValueOf("overallRating")).as("star"),
                Aggregation.group("star").count().as("count"),
                Aggregation.project("count").and("_id").as("star"));

        AggregationResults<StarBucket> results = mongoTemplate.aggregate(
                aggregation, RATINGS_COLLECTION, StarBucket.class);

        long[] counts = new long[6]; // índice 1..5

        for (StarBucket bucket : results.getMappedResults()) {
            int star = (int) Math.max(1, Math.min(5, Math.round(bucket.star())));
            counts[star] += bucket.count();
        }

        return counts;
    }

    /** IDs de todos os títulos com pelo menos uma avaliação (para reconciliação). */
    public List<String> distinctRatedTitleIds() {
        return mongoTemplate.findDistinct(
                new org.springframework.data.mongodb.core.query.Query(),
                "titleId", RATINGS_COLLECTION, String.class);
    }

    public record RatingStats(
            double average, long count,
            long star1, long star2, long star3, long star4, long star5
    ) {
        public static RatingStats empty() {
            return new RatingStats(0.0, 0, 0, 0, 0, 0, 0);
        }
    }

    private record AvgDoc(double average, long count) {}

    private record StarBucket(double star, long count) {}
}
