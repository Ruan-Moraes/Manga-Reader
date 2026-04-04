package com.mangareader.presentation.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response de autenticação (retornado em sign-in, sign-up e refresh).
 * <p>
 * Compatível com o frontend que espera {@code token} ou {@code accessToken}
 * no localStorage.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String userId,
        String name,
        String email,
        String role,
        String photoUrl,
        String adultContentPreference
) {}
