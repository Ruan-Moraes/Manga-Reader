package com.mangareader.presentation.admin.mapper;

import java.util.Map;

import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionAuditLog;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.presentation.admin.dto.AdminSubscriptionResponse;
import com.mangareader.presentation.admin.dto.SubscriptionAuditLogResponse;
import com.mangareader.presentation.admin.dto.SubscriptionSummaryResponse;
import com.mangareader.presentation.subscription.dto.SubscriptionPlanResponse;

/**
 * Mapper estático Subscription → AdminSubscriptionResponse e summary.
 */
public final class AdminSubscriptionMapper {

    private AdminSubscriptionMapper() {
    }

    public static AdminSubscriptionResponse toResponse(Subscription subscription) {
        return new AdminSubscriptionResponse(
                subscription.getId(),
                subscription.getUserId(),
                subscription.getPlan().getPeriod(),
                subscription.getPlan().getPriceInCents(),
                subscription.getStartDate(),
                subscription.getEndDate(),
                subscription.getStatus(),
                subscription.getCreatedAt()
        );
    }

    public static SubscriptionSummaryResponse toSummaryResponse(Map<SubscriptionStatus, Long> counts) {
        return new SubscriptionSummaryResponse(
                counts.getOrDefault(SubscriptionStatus.ACTIVE, 0L),
                counts.getOrDefault(SubscriptionStatus.EXPIRED, 0L),
                counts.getOrDefault(SubscriptionStatus.CANCELLED, 0L)
        );
    }

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

    public static SubscriptionAuditLogResponse toAuditLogResponse(SubscriptionAuditLog log) {
        return new SubscriptionAuditLogResponse(
                log.getId(),
                log.getSubscriptionId(),
                log.getUserId(),
                log.getAction(),
                log.getPerformedBy(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }
}
