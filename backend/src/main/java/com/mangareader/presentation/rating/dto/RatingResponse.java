package com.mangareader.presentation.rating.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de avaliação retornado ao frontend.
 * <p>
 * Compatível com o frontend ({@code MangaRating} em rating.types.ts).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RatingResponse(
        String id,
        String titleId,
        String userName,
        double stars,
        String comment,
        Map<String, Double> categoryRatings,
        String createdAt
) {}
