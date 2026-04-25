package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para banir um usuário.
 */
public record BanUserRequest(
        @NotBlank(message = "{validation.ban.reason.required}")
        String reason,
        LocalDateTime bannedUntil
) {
}
