package com.mangareader.presentation.rating.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * Request para atualizar uma avaliação existente.
 * <p>
 * Campos nulos são ignorados (PATCH semântico).
 */
public record UpdateRatingRequest(
        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        Double funRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        Double artRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        Double storylineRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        Double charactersRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        Double originalityRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        Double pacingRating,

        @Size(max = 2000, message = "{validation.rating.comment.size}")
        String comment
) {}
