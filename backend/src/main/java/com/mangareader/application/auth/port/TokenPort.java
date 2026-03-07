package com.mangareader.application.auth.port;

import java.util.UUID;

/**
 * Port de saída — geração e validação de tokens JWT.
 */
public interface TokenPort {

    /**
     * Gera um access token para o usuário.
     */
    String generateAccessToken(UUID userId, String email, String role);

    /**
     * Gera um refresh token para o usuário.
     */
    String generateRefreshToken(UUID userId);

    /**
     * Extrai o userId (subject) do token.
     */
    UUID extractUserId(String token);

    /**
     * Extrai o email do token (claim customizado).
     */
    String extractEmail(String token);

    /**
     * Valida se o token é válido e não expirou.
     */
    boolean isTokenValid(String token);

    /**
     * Gera um token de redefinição de senha (curta duração).
     */
    String generatePasswordResetToken(UUID userId, String email);

    /**
     * Extrai o role do token (claim customizado).
     */
    String extractRole(String token);

    /**
     * Extrai o tipo do token (claim customizado "type").
     */
    String extractType(String token);
}
