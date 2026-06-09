package com.mangareader.application.rating.usecase;

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
public class GetRatingAverageUseCase {
    private final TitleRatingAggregateReadPort aggregateReadPort;

    public record RatingAverage(double average, long count) {}

    public RatingAverage execute(String titleId) {
        return aggregateReadPort.findByTitleId(titleId)
                .map(v -> new RatingAverage(v.ratingAverage(), v.totalRatings()))
                .orElseGet(() -> new RatingAverage(0.0, 0));
    }
}
