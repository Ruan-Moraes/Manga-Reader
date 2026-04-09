package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Resposta detalhada de um usuário para o painel admin.
 */
public record AdminUserResponse(
        UUID id,
        String name,
        String email,
        String photoUrl,
        String role,
        boolean banned,
        LocalDateTime bannedAt,
        String bannedReason,
        LocalDateTime bannedUntil,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
