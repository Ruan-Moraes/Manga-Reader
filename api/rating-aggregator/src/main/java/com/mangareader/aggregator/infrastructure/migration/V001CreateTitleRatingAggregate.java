package com.mangareader.aggregator.infrastructure.migration;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.mangareader.aggregator.domain.TitleRatingAggregate;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;

/**
 * Mongock ChangeUnit — cria a coleção {@code title_rating_aggregate} e faz
 * backfill a partir das resenhas existentes em {@code ratings}.
 * <p>
 * Resolve o cold-start: títulos já avaliados passam a exibir a nota correta
 * imediatamente, sem depender de um evento futuro. Idempotente — recomputa o
 * agregado de cada título avaliado (upsert por {@code _id = titleId}).
 */
@Slf4j
@ChangeUnit(id = "V001-create-title-rating-aggregate", order = "001", author = "mangareader")
public class V001CreateTitleRatingAggregate {
    private static final String RATINGS = "ratings";

    private final MongoTemplate mongoTemplate;

    public V001CreateTitleRatingAggregate(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Execution
    public void execute() {
        List<String> titleIds = mongoTemplate.findDistinct(
                new Query(), "titleId", RATINGS, String.class);

        log.info("V001 início — backfill de title_rating_aggregate para {} títulos", titleIds.size());

        LocalDateTime now = LocalDateTime.now();

        for (String titleId : titleIds) {
            mongoTemplate.save(buildAggregate(titleId, now));
        }

        log.info("V001 fim — {} agregados gravados", titleIds.size());
    }

    private TitleRatingAggregate buildAggregate(String titleId, LocalDateTime now) {
        AvgDoc avg = mongoTemplate.aggregate(
                Aggregation.newAggregation(
                        Aggregation.match(Criteria.where("titleId").is(titleId)),
                        Aggregation.group()
                                .avg("overallRating").as("average")
                                .count().as("count")),
                RATINGS, AvgDoc.class).getUniqueMappedResult();

        if (avg == null || avg.count() == 0) {
            return TitleRatingAggregate.empty(titleId, now);
        }

        long[] buckets = distribution(titleId);

        return TitleRatingAggregate.builder()
                .titleId(titleId)
                .ratingAverage(Math.round(avg.average() * 10.0) / 10.0)
                .totalRatings(avg.count())
                .star1(buckets[1]).star2(buckets[2]).star3(buckets[3])
                .star4(buckets[4]).star5(buckets[5])
                .updatedAt(now)
                .build();
    }

    private long[] distribution(String titleId) {
        AggregationResults<StarBucket> results = mongoTemplate.aggregate(
                Aggregation.newAggregation(
                        Aggregation.match(Criteria.where("titleId").is(titleId)),
                        Aggregation.project()
                                .and(ArithmeticOperators.Round.roundValueOf("overallRating")).as("star"),
                        Aggregation.group("star").count().as("count"),
                        Aggregation.project("count").and("_id").as("star")),
                RATINGS, StarBucket.class);

        long[] counts = new long[6];

        for (StarBucket bucket : results.getMappedResults()) {
            int star = (int) Math.max(1, Math.min(5, Math.round(bucket.star())));
            counts[star] += bucket.count();
        }

        return counts;
    }

    @RollbackExecution
    public void rollback() {
        mongoTemplate.dropCollection(TitleRatingAggregate.class);
    }

    private record AvgDoc(double average, long count) {}

    private record StarBucket(double star, long count) {}
}
