package com.mangareader.presentation.admin.dto;

import java.util.List;

public record UpdateSubscriptionPlanRequest(
        Long priceInCents,
        String description,
        List<String> features,
        Boolean active
) {}
