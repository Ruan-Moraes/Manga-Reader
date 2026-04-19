package com.mangareader.presentation.subscription.mapper;

import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.presentation.subscription.dto.GiftCodeResponse;
import com.mangareader.presentation.subscription.dto.SubscriptionPlanResponse;
import com.mangareader.presentation.subscription.dto.SubscriptionResponse;

/**
 * Mapper estático para conversão entre entities de assinatura e DTOs de resposta.
 */
public final class SubscriptionMapper {

    private SubscriptionMapper() {}

    public static SubscriptionPlanResponse toPlanResponse(SubscriptionPlan plan) {
        return new SubscriptionPlanResponse(
                plan.getId(),
                plan.getPeriod(),
                plan.getPriceInCents(),
                plan.getDescription(),
                plan.getFeatures(),
                plan.isActive()
        );
    }

    public static SubscriptionResponse toSubscriptionResponse(Subscription subscription) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getUserId(),
                toPlanResponse(subscription.getPlan()),
                subscription.getStartDate(),
                subscription.getEndDate(),
                subscription.getStatus()
        );
    }

    public static GiftCodeResponse toGiftCodeResponse(GiftCode giftCode) {
        return new GiftCodeResponse(
                giftCode.getId(),
                giftCode.getCode(),
                toPlanResponse(giftCode.getPlan()),
                giftCode.getRecipientEmail(),
                giftCode.getExpiresAt(),
                giftCode.getStatus()
        );
    }
}
