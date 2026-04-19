package com.mangareader.application.subscription.usecase.admin;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo plano de assinatura (admin).
 */
@Service
@RequiredArgsConstructor
public class CreateSubscriptionPlanUseCase {
    private final SubscriptionPlanRepositoryPort planRepository;

    @Transactional
    public SubscriptionPlan execute(SubscriptionPeriod period, long priceInCents,
                                     String description, List<String> features) {
        var plan = SubscriptionPlan.builder()
                .period(period)
                .priceInCents(priceInCents)
                .description(description)
                .features(features != null ? features : List.of())
                .active(true)
                .build();

        return planRepository.save(plan);
    }
}
