package com.mangareader.presentation.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request de login (Sign In).
 */
public record SignInRequest(
        @NotBlank(message = "E-mail é obrigatório.")
        @Email(message = "E-mail inválido.")
        String email,

        @NotBlank(message = "Senha é obrigatória.")
        String password
) {}
