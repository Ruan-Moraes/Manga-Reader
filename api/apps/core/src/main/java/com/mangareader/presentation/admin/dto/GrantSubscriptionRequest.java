package com.mangareader.presentation.admin.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record GrantSubscriptionRequest(
        @NotNull(message = "{validation.subscription.userId.required}") UUID userId,
        @NotNull(message = "{validation.subscription.planId.required}") UUID planId
) {}
