package com.mangareader.application.auth.port;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Port de saída — geração e validação de tokens JWT.
 */
public interface TokenPort {
    String generateAccessToken(UUID userId, String email, String role);

    String generateRefreshToken(UUID userId);

    UUID extractUserId(String token);

    String extractEmail(String token);

    boolean isTokenValid(String token);

    String generatePasswordResetToken(UUID userId, String email, String passwordHash);

    boolean matchesPasswordState(String token, String passwordHash);

    Duration passwordResetExpiration();

    String extractRole(String token);

    String extractType(String token);

    String extractTokenId(String token);

    LocalDateTime extractExpiration(String token);
}
