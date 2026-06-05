package com.mangareader.presentation.rating.dto;

/**
 * DTO com a média de estrelas e contagem de avaliações.
 */
public record RatingAverageResponse(
        double average,
        long count
) {}
