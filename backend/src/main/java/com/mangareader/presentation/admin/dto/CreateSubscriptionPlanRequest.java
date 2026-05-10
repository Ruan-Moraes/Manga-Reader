package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateSubscriptionPlanRequest(
        @NotNull SubscriptionPeriod period,
        @Min(1) long priceInCents,
        @NotNull @RequiredLanguages Map<String, String> description,
        Map<String, List<String>> features,
        Map<String, Long> prices
) {}
