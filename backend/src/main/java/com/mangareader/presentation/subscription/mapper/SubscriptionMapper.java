package com.mangareader.presentation.subscription.mapper;

import org.springframework.stereotype.Component;

import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;
import com.mangareader.presentation.subscription.dto.GiftCodeResponse;
import com.mangareader.presentation.subscription.dto.SubscriptionPlanResponse;
import com.mangareader.presentation.subscription.dto.SubscriptionResponse;

import lombok.RequiredArgsConstructor;

/**
 * Mapper de assinatura → DTOs públicos. Resolve description/features pelo
 * locale do request via {@link LocalizedMappingHelper#resolveOrFallback}.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionMapper {

    private final LocalizedMappingHelper i18n;

    public SubscriptionPlanResponse toPlanResponse(SubscriptionPlan plan) {
        return new SubscriptionPlanResponse(
                plan.getId(),
                plan.getPeriod(),
                plan.getPriceInCents(),
                i18n.toResolvedString(plan.getDescription()),
                i18n.toResolvedList(plan.getFeatures()),
                plan.isActive(),
                plan.getPrices()
        );
    }

    public SubscriptionResponse toSubscriptionResponse(Subscription subscription) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getUserId(),
                toPlanResponse(subscription.getPlan()),
                subscription.getStartDate(),
                subscription.getEndDate(),
                subscription.getStatus()
        );
    }

    public GiftCodeResponse toGiftCodeResponse(GiftCode giftCode) {
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
