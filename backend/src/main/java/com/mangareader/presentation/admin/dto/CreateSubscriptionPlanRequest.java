package com.mangareader.presentation.admin.dto;

import java.util.List;

import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSubscriptionPlanRequest(
        @NotNull SubscriptionPeriod period,
        @Min(1) long priceInCents,
        @NotBlank @Size(max = 300) String description,
        List<String> features
) {}
