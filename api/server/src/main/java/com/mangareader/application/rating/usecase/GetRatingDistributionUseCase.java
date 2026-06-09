package com.mangareader.application.rating.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.rating.port.RatingRepositoryPort.RatingDistribution;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a distribuição de avaliações de um título por faixa de estrela (1–5).
 * <p>
 * Lê do agregado consolidado ({@code title_rating_aggregate}, mantido pelo
 * serviço {@code rating-aggregator}) — sem agregação ao vivo durante a
 * renderização. Título sem agregado ⇒ distribuição vazia.
 */
@Service
@RequiredArgsConstructor
public class GetRatingDistributionUseCase {
    private final TitleRatingAggregateReadPort aggregateReadPort;

    public RatingDistribution execute(String titleId) {
        return aggregateReadPort.findByTitleId(titleId)
                .map(v -> new RatingDistribution(v.star1(), v.star2(), v.star3(), v.star4(), v.star5()))
                .orElseGet(RatingDistribution::empty);
    }
}
