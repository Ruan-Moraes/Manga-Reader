package com.mangareader.presentation.subscription.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Requisição para criar um código de presente.
 */
public record CreateGiftCodeRequest(
        @NotNull UUID planId,
        @NotBlank @Email String recipientEmail
) {}
