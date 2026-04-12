package com.mangareader.application.subscription.usecase.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionAuditPort;
import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Concede uma assinatura a um usuário sem pagamento (ação administrativa).
 */
@Service
@RequiredArgsConstructor
public class GrantSubscriptionUseCase {

    private final SubscriptionRepositoryPort subscriptionRepository;
    private final SubscriptionPlanRepositoryPort planRepository;
    private final SubscriptionAuditPort auditPort;

    @Transactional
    public Subscription execute(UUID userId, UUID planId) {
        var plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = calculateEndDate(now, plan.getPeriod());

        var subscription = Subscription.builder()
                .userId(userId)
                .plan(plan)
                .startDate(now)
                .endDate(endDate)
                .status(SubscriptionStatus.ACTIVE)
                .externalPaymentId("ADMIN_GRANT")
                .build();

        var saved = subscriptionRepository.save(subscription);
        auditPort.log(saved.getId(), userId, "GRANTED", null, "Admin granted subscription with plan " + plan.getPeriod());
        return saved;
    }

    private LocalDateTime calculateEndDate(LocalDateTime start, SubscriptionPeriod period) {
        return switch (period) {
            case DAILY -> start.plusDays(1);
            case MONTHLY -> start.plusMonths(1);
            case ANNUAL -> start.plusYears(1);
        };
    }
}
