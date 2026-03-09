package com.mangareader.presentation.rating.dto;

import java.util.Map;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para submeter ou atualizar uma avaliação.
 */
public record SubmitRatingRequest(
        @NotBlank(message = "ID do título é obrigatório.")
        @Size(max = 100, message = "ID do título deve ter no máximo 100 caracteres.")
        String titleId,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        double stars,

        @Size(max = 2000, message = "Comentário deve ter no máximo 2000 caracteres.")
        String comment,

        Map<String, Double> categoryRatings
) {}
