package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

public record UpdateSubscriptionPlanRequest(
        Long priceInCents,
        String description,
        List<String> features,
        Map<String, String> descriptionI18n,
        Map<String, List<String>> featuresI18n,
        Boolean active,
        Map<String, Long> prices
) {}
