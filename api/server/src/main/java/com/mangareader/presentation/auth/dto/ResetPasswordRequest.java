package com.mangareader.presentation.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para redefinição de senha.
 */
public record ResetPasswordRequest(
        @NotBlank(message = "{validation.token.required}")
        @Size(max = 2048, message = "{validation.token.size}")
        String token,

        @NotBlank(message = "{validation.password.new.required}")
        @Size(min = 6, max = 128, message = "{validation.password.size}")
        String newPassword
) {}
