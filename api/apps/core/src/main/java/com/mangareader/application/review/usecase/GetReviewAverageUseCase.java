package com.mangareader.application.review.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a média de estrelas e a contagem de avaliações de um título.
 * <p>
 * Lê o agregado consolidado ({@code title_rating_aggregate}, mantido pelo
 * serviço {@code rating-aggregator}) — leitura O(1) por título, sem agregação
 * ao vivo durante a renderização. Título sem agregado ⇒ {@code 0.0 / 0}.
 */
@Service
@RequiredArgsConstructor
public class GetReviewAverageUseCase {
    private final TitleRatingAggregateReadPort aggregateReadPort;

    public record ReviewAverage(double average, long count) {}

    public ReviewAverage execute(String titleId) {
        return aggregateReadPort.findByTitleId(titleId)
                .map(v -> new ReviewAverage(v.ratingAverage(), v.totalRatings()))
                .orElseGet(() -> new ReviewAverage(0.0, 0));
    }
}
