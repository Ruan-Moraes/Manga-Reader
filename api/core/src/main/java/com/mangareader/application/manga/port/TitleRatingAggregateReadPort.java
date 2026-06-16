package com.mangareader.application.manga.port;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port de leitura do agregado de avaliação ({@code title_rating_aggregate}),
 * fonte oficial de nota/contagem. A coleção é mantida pelo serviço
 * {@code rating-aggregator}; o monolito apenas lê (O(1) por título, sem
 * agregação ao vivo durante a renderização).
 */
public interface TitleRatingAggregateReadPort {
    Optional<TitleRatingAggregateView> findByTitleId(String titleId);

    Map<String, TitleRatingAggregateView> findByTitleIdIn(Collection<String> titleIds);

    List<TitleRatingAggregateView> findTop(int limit);

    /**
     * Visão imutável do agregado de um título. Espelha o schema escrito pelo
     * aggregator (contrato — sem jar compartilhado).
     */
    record TitleRatingAggregateView(
            String titleId,
            double ratingAverage,
            long totalRatings,
            long star1,
            long star2,
            long star3,
            long star4,
            long star5
    ) {
        public static TitleRatingAggregateView empty(String titleId) {
            return new TitleRatingAggregateView(titleId, 0.0, 0, 0, 0, 0, 0, 0);
        }
    }
}
