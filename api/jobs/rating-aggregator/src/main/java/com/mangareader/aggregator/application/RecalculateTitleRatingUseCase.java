package com.mangareader.aggregator.application;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.mangareader.aggregator.domain.TitleRatingAggregate;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao.RatingStats;
import com.mangareader.aggregator.infrastructure.repository.TitleRatingAggregateRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Recalcula e persiste o agregado de avaliação de um título a partir da
 * coleção {@code reviews}, fazendo upsert em {@code reviews_aggregate}.
 * <p>
 * Sem avaliações ⇒ grava agregado zerado (mantém a obra como fonte válida com
 * nota 0 / 0 avaliações, evitando divergência com "documento ausente").
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecalculateTitleRatingUseCase {
    private final RatingAggregationDao ratingAggregationDao;
    private final TitleRatingAggregateRepository aggregateRepository;

    public TitleRatingAggregate execute(String titleId) {
        RatingStats stats = ratingAggregationDao.aggregate(titleId);

        LocalDateTime now = LocalDateTime.now();

        TitleRatingAggregate aggregate = stats.count() == 0
                ? TitleRatingAggregate.empty(titleId, now)
                : TitleRatingAggregate.builder()
                        .titleId(titleId)
                        .ratingAverage(round1(stats.average()))
                        .totalRatings(stats.count())
                        .star1(stats.star1())
                        .star2(stats.star2())
                        .star3(stats.star3())
                        .star4(stats.star4())
                        .star5(stats.star5())
                        .updatedAt(now)
                        .build();

        TitleRatingAggregate saved = aggregateRepository.save(aggregate);

        log.debug("Recalculated aggregate for title {}: avg={} total={}",
                titleId, saved.getRatingAverage(), saved.getTotalRatings());

        return saved;
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
