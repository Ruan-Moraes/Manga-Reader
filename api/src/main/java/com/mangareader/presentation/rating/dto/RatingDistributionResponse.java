package com.mangareader.presentation.rating.dto;

import com.mangareader.application.rating.port.RatingRepositoryPort.RatingDistribution;

/**
 * DTO com a contagem de avaliações por faixa de estrela (1–5) e o total.
 */
public record RatingDistributionResponse(
        long star1,
        long star2,
        long star3,
        long star4,
        long star5,
        long total
) {
    public static RatingDistributionResponse from(RatingDistribution d) {
        return new RatingDistributionResponse(
                d.star1(), d.star2(), d.star3(), d.star4(), d.star5(), d.total());
    }
}
