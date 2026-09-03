package com.mangareader.presentation.auth.dto;

/**
 * Request de renovação de token (Refresh).
 * <p>
 * Body opcional: clientes web enviam o token via cookie httpOnly; o body é
 * o canal do mobile. A validação de presença acontece no controller, na
 * resolução cookie-ou-body.
 */
public record RefreshTokenRequest(
        String refreshToken
) {}
