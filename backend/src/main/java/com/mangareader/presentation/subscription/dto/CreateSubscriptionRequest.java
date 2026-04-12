package com.mangareader.presentation.subscription.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

/**
 * Requisição para criar uma nova assinatura.
 */
public record CreateSubscriptionRequest(
        @NotNull UUID planId
) {}
