package com.mangareader.presentation.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request de cadastro (Sign Up).
 */
public record SignUpRequest(
        @NotBlank(message = "{validation.name.required}")
        @Size(min = 2, max = 100, message = "{validation.name.size}")
        String name,

        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.email.invalid}")
        String email,

        @NotBlank(message = "{validation.password.required}")
        @Size(min = 6, max = 128, message = "{validation.password.size}")
        String password
) {}
