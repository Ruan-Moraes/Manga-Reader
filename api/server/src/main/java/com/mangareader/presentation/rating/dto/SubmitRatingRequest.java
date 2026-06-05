package com.mangareader.presentation.rating.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para submeter ou atualizar uma avaliação.
 */
public record SubmitRatingRequest(
        @NotBlank(message = "{validation.rating.titleId.required}")
        @Size(max = 100, message = "{validation.rating.titleId.size}")
        String titleId,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        double funRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        double artRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        double storylineRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        double charactersRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        double originalityRating,

        @Min(value = 1, message = "{validation.rating.min}")
        @Max(value = 5, message = "{validation.rating.max}")
        double pacingRating,

        @Size(max = 2000, message = "{validation.rating.comment.size}")
        String comment
) {}
