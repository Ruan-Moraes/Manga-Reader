package com.mangareader.application.subscription.usecase.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um plano de assinatura existente (admin).
 */
@Service
@RequiredArgsConstructor
public class UpdateSubscriptionPlanUseCase {

    private final SubscriptionPlanRepositoryPort planRepository;

    @Transactional
    public SubscriptionPlan execute(UUID planId, Long priceInCents, String description,
                                     List<String> features, Boolean active) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));

        if (priceInCents != null) plan.setPriceInCents(priceInCents);
        if (description != null) plan.setDescription(description);
        if (features != null) plan.setFeatures(features);
        if (active != null) plan.setActive(active);

        return planRepository.save(plan);
    }
}
