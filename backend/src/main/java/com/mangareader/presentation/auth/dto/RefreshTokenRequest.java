package com.mangareader.presentation.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request de renovação de token (Refresh).
 */
public record RefreshTokenRequest(
        @NotBlank(message = "{validation.refreshToken.required}")
        String refreshToken
) {}
