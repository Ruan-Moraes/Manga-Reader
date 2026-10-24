package com.toonlira.presentation.subscription.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.toonlira.domain.subscription.valueobject.SubscriptionPeriod;

/**
 * Representa um plano de assinatura disponível na plataforma.
 */
public record SubscriptionPlanResponse(
        UUID id,
        SubscriptionPeriod period,
        long priceInCents,
        String description,
        List<String> features,
        boolean active,
        Map<String, Long> prices
) {}
