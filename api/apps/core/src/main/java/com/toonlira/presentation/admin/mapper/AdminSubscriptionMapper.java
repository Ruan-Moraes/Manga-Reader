package com.toonlira.presentation.admin.mapper;

import java.util.Map;

import org.springframework.context.i18n.LocaleContextHolder;

import com.toonlira.domain.subscription.entity.Subscription;
import com.toonlira.domain.subscription.entity.SubscriptionAuditLog;
import com.toonlira.domain.subscription.entity.SubscriptionPlan;
import com.toonlira.domain.subscription.valueobject.SubscriptionStatus;
import com.toonlira.presentation.admin.dto.AdminSubscriptionResponse;
import com.toonlira.presentation.admin.dto.SubscriptionAuditLogResponse;
import com.toonlira.presentation.admin.dto.SubscriptionSummaryResponse;
import com.toonlira.presentation.subscription.dto.SubscriptionPlanResponse;

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
        var locale = LocaleContextHolder.getLocale();
        return new SubscriptionPlanResponse(
                plan.getId(),
                plan.getPeriod(),
                plan.getPriceInCents(),
                plan.getDescription() != null ? plan.getDescription().resolve(locale) : "",
                plan.getFeatures() != null ? plan.getFeatures().resolve(locale) : java.util.List.of(),
                plan.isActive(),
                plan.getPrices()
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
