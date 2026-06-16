package com.mangareader.presentation.review.dto;

import com.mangareader.application.review.port.ReviewRepositoryPort.ReviewDistribution;

/**
 * DTO com a contagem de avaliações por faixa de estrela (1–5) e o total.
 */
public record ReviewDistributionResponse(
        long star1,
        long star2,
        long star3,
        long star4,
        long star5,
        long total
) {
    public static ReviewDistributionResponse from(ReviewDistribution d) {
        return new ReviewDistributionResponse(
                d.star1(), d.star2(), d.star3(), d.star4(), d.star5(), d.total());
    }
}
