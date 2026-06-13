package com.mangareader.aggregator.infrastructure.repository;

import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Leitura agregada da coleção {@code reviews} (escrita pelo monolito).
 * <p>
 * Espelha as agregações do {@code RatingRepositoryAdapter} do api/server
 * (média/contagem + distribuição por {@code Round(overallRating)}). Apps
 * independentes — sem jar compartilhado.
 */
@Component
@RequiredArgsConstructor
public class RatingAggregationDao {
    private static final String REVIEWS_COLLECTION = "reviews";

    private final MongoTemplate mongoTemplate;

    /**
     * Média ({@code overallRating}), contagem e distribuição por estrela (1–5)
     * de um título, computadas no banco em uma única agregação ({@code $facet}
     * com dois sub-pipelines sobre o mesmo {@code $match}).
     */
    public RatingStats aggregate(String titleId) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("titleId").is(titleId)),
                Aggregation.facet(
                                Aggregation.group()
                                        .avg("overallRating").as("average")
                                        .count().as("count"))
                        .as("summary")
                        .and(
                                Aggregation.project()
                                        .and(ArithmeticOperators.Round.roundValueOf("overallRating")).as("star"),
                                Aggregation.group("star").count().as("count"),
                                Aggregation.project("count").and("_id").as("star"))
                        .as("stars"));

        FacetResult result = mongoTemplate.aggregate(
                aggregation, REVIEWS_COLLECTION, FacetResult.class).getUniqueMappedResult();

        if (result == null || result.summary().isEmpty()) {
            return RatingStats.empty();
        }

        AvgDoc avg = result.summary().getFirst();
        long[] counts = new long[6]; // índice 1..5

        for (StarBucket bucket : result.stars()) {
            int star = (int) Math.max(1, Math.min(5, Math.round(bucket.star())));
            counts[star] += bucket.count();
        }

        return new RatingStats(avg.average(), avg.count(),
                counts[1], counts[2], counts[3], counts[4], counts[5]);
    }

    /** IDs de todos os títulos com pelo menos uma avaliação (para reconciliação). */
    public List<String> distinctRatedTitleIds() {
        return mongoTemplate.findDistinct(
                new Query(), "titleId", REVIEWS_COLLECTION, String.class);
    }

    public record RatingStats(
            double average, long count,
            long star1, long star2, long star3, long star4, long star5
    ) {
        public static RatingStats empty() {
            return new RatingStats(0.0, 0, 0, 0, 0, 0, 0);
        }
    }

    private record FacetResult(List<AvgDoc> summary, List<StarBucket> stars) {}

    private record AvgDoc(double average, long count) {}

    private record StarBucket(double star, long count) {}
}
