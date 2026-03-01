package com.mangareader.presentation.rating.dto;

import java.util.Map;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Request para submeter ou atualizar uma avaliação.
 */
public record SubmitRatingRequest(
        @NotBlank(message = "ID do título é obrigatório.")
        String titleId,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        double stars,

        String comment,

        Map<String, Double> categoryRatings
) {}
