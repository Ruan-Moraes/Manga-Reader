package com.mangareader.presentation.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request de renovação de token (Refresh).
 */
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token é obrigatório.")
        String refreshToken
) {}
