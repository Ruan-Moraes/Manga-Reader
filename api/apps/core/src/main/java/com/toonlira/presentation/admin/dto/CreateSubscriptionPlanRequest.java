package com.toonlira.presentation.admin.dto;

import java.util.List;
import java.util.Map;

import com.toonlira.domain.subscription.valueobject.SubscriptionPeriod;
import com.toonlira.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateSubscriptionPlanRequest(
        @NotNull(message = "{validation.subscription.plan.period.required}") SubscriptionPeriod period,
        @Min(value = 1, message = "{validation.subscription.plan.priceInCents.min}") long priceInCents,
        @NotNull(message = "{validation.subscription.plan.description.required}") @RequiredLanguages Map<String, String> description,
        Map<String, List<String>> features,
        Map<String, Long> prices
) {}
