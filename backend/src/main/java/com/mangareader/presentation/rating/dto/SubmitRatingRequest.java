package com.mangareader.presentation.rating.dto;

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
        double funRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        double artRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        double storylineRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        double charactersRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        double originalityRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        double pacingRating,

        @Size(max = 2000, message = "Comentário deve ter no máximo 2000 caracteres.")
        String comment
) {}
