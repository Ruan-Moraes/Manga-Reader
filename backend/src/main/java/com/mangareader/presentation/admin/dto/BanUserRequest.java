package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para banir um usuário.
 */
public record BanUserRequest(
        @NotBlank(message = "Motivo do ban é obrigatório")
        String reason,
        LocalDateTime bannedUntil
) {
}
