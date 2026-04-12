package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

/**
 * Resposta de assinatura para o painel administrativo.
 */
public record AdminSubscriptionResponse(
        UUID id,
        UUID userId,
        SubscriptionPeriod planPeriod,
        long planPriceInCents,
        LocalDateTime startDate,
        LocalDateTime endDate,
        SubscriptionStatus status,
        LocalDateTime createdAt
) {}
