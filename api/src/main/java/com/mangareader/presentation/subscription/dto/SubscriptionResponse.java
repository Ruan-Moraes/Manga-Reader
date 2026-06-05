package com.mangareader.presentation.subscription.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

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
