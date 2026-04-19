package com.mangareader.presentation.subscription.dto;

import java.util.List;
import java.util.UUID;

import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;

/**
 * Representa um plano de assinatura disponível na plataforma.
 */
public record SubscriptionPlanResponse(
        UUID id,
        SubscriptionPeriod period,
        long priceInCents,
        String description,
        List<String> features,
        boolean active
) {}
