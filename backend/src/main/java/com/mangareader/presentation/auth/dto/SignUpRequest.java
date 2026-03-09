package com.mangareader.presentation.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request de cadastro (Sign Up).
 */
public record SignUpRequest(
        @NotBlank(message = "Nome é obrigatório.")
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres.")
        String name,

        @NotBlank(message = "E-mail é obrigatório.")
        @Email(message = "E-mail inválido.")
        String email,

        @NotBlank(message = "Senha é obrigatória.")
        @Size(min = 6, max = 128, message = "Senha deve ter entre 6 e 128 caracteres.")
        String password
) {}
