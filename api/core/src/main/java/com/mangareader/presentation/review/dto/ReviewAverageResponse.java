package com.mangareader.presentation.review.dto;

/**
 * DTO com a média de estrelas e contagem de avaliações.
 */
public record ReviewAverageResponse(
        double average,
        long count
) {}
