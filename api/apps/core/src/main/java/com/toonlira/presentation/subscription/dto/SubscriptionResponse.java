package com.toonlira.presentation.subscription.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.toonlira.domain.subscription.valueobject.SubscriptionStatus;

/**
 * Representa uma assinatura ativa de um usuário.
 */
public record SubscriptionResponse(
        UUID id,
        UUID userId,
        SubscriptionPlanResponse plan,
        LocalDateTime startDate,
        LocalDateTime endDate,
        SubscriptionStatus status
) {}
