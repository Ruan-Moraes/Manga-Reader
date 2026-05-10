package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

public record UpdateSubscriptionPlanRequest(
        Long priceInCents,
        Map<String, String> description,
        Map<String, List<String>> features,
        Boolean active,
        Map<String, Long> prices
) {}
