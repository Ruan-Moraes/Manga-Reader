package com.mangareader.application.subscription.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.PaymentGatewayPort;
import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

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

    @Transactional
    public Subscription execute(UUID userId, UUID planId) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));

        String externalPaymentId = paymentGateway.createPaymentIntent(
                plan.getPriceInCents(),
                "Assinatura Manga Reader — " + plan.getPeriod(),
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

        return subscriptionRepository.save(subscription);
    }

    private LocalDateTime calculateEndDate(LocalDateTime start, SubscriptionPeriod period) {
        return switch (period) {
            case DAILY -> start.plusDays(DAILY_DURATION_DAYS);
            case MONTHLY -> start.plusMonths(MONTHLY_DURATION_MONTHS);
            case ANNUAL -> start.plusYears(ANNUAL_DURATION_YEARS);
        };
    }
}
