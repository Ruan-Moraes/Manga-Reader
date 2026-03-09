package com.mangareader.presentation.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para redefinição de senha.
 */
public record ResetPasswordRequest(
        @NotBlank(message = "Token é obrigatório")
        @Size(max = 2048, message = "Token deve ter no máximo 2048 caracteres")
        String token,

        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = 6, max = 128, message = "Senha deve ter entre 6 e 128 caracteres")
        String newPassword
) {}
