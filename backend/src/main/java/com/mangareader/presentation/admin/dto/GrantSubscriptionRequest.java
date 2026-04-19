package com.mangareader.presentation.admin.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record GrantSubscriptionRequest(
        @NotNull UUID userId,
        @NotNull UUID planId
) {}
