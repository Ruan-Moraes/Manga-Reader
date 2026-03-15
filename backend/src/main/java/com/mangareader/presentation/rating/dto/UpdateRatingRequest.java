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
        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        Double funRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        Double artRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        Double storylineRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        Double charactersRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        Double originalityRating,

        @Min(value = 1, message = "Nota mínima é 1.")
        @Max(value = 5, message = "Nota máxima é 5.")
        Double pacingRating,

        @Size(max = 2000, message = "Comentário deve ter no máximo 2000 caracteres.")
        String comment
) {}
