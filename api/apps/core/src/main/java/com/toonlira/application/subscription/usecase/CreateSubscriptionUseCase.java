package com.toonlira.application.subscription.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.subscription.port.PaymentGatewayPort;
import com.toonlira.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.toonlira.application.subscription.port.SubscriptionRepositoryPort;
import com.toonlira.domain.subscription.entity.Subscription;
import com.toonlira.domain.subscription.entity.SubscriptionPlan;
import com.toonlira.domain.subscription.valueobject.SubscriptionPeriod;
import com.toonlira.domain.subscription.valueobject.SubscriptionStatus;
import com.toonlira.shared.exception.ResourceNotFoundException;
import com.toonlira.application.analytics.service.BehaviorEventRecorder;
import com.toonlira.domain.analytics.entity.BehaviorEventType;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova assinatura para o usuário autenticado.
 * <p>
 * Fluxo: valida plano → cria PaymentIntent no gateway → persiste Subscription.
 */
@Service
@RequiredArgsConstructor
public class CreateSubscriptionUseCase {
    private static final int DAILY_DURATION_DAYS = 1;
    private static final int MONTHLY_DURATION_MONTHS = 1;
    private static final int ANNUAL_DURATION_YEARS = 1;

    private final SubscriptionPlanRepositoryPort planRepository;
    private final SubscriptionRepositoryPort subscriptionRepository;
    private final PaymentGatewayPort paymentGateway;
    private final BehaviorEventRecorder behaviorEventRecorder;

    @Transactional
    public Subscription execute(UUID userId, UUID planId) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));

        String externalPaymentId = paymentGateway.createPaymentIntent(
                plan.getPriceInCents(),
                "Assinatura Toonlira — " + plan.getPeriod(),
                userId.toString()
        );

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = calculateEndDate(now, plan.getPeriod());

        Subscription subscription = Subscription.builder()
                .userId(userId)
                .plan(plan)
                .startDate(now)
                .endDate(endDate)
                .status(SubscriptionStatus.ACTIVE)
                .externalPaymentId(externalPaymentId)
                .build();

        Subscription result = subscriptionRepository.save(subscription);
        behaviorEventRecorder.record(userId, BehaviorEventType.SUBSCRIPTION_CREATED, null, null,
                plan.getPeriod().name());
        return result;
    }

    private LocalDateTime calculateEndDate(LocalDateTime start, SubscriptionPeriod period) {
        return switch (period) {
            case DAILY -> start.plusDays(DAILY_DURATION_DAYS);
            case MONTHLY -> start.plusMonths(MONTHLY_DURATION_MONTHS);
            case ANNUAL -> start.plusYears(ANNUAL_DURATION_YEARS);
        };
    }
}
