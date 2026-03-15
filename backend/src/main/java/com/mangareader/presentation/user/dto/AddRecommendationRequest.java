package com.mangareader.presentation.user.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para adicionar uma recomendação ao perfil.
 */
public record AddRecommendationRequest(
        @NotBlank(message = "titleId é obrigatório")
        String titleId
) {}
