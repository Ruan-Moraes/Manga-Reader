package com.mangareader.presentation.subscription.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Requisição para criar um código de presente.
 */
public record CreateGiftCodeRequest(
        @NotNull(message = "{validation.subscription.planId.required}") UUID planId,
        @NotBlank(message = "{validation.gift.recipientEmail.required}")
        @Email(message = "{validation.email.invalid}") String recipientEmail
) {}
