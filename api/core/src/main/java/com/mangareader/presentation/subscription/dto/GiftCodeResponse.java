package com.mangareader.presentation.subscription.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.mangareader.domain.subscription.valueobject.GiftCodeStatus;

/**
 * Representa um código de presente criado pelo usuário.
 */
public record GiftCodeResponse(
        UUID id,
        String code,
        SubscriptionPlanResponse plan,
        String recipientEmail,
        LocalDateTime expiresAt,
        GiftCodeStatus status
) {}
