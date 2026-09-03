package com.mangareader.application.subscription.usecase.admin;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.application.shared.port.CacheInvalidationPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um plano de assinatura existente (admin). Mapas, quando presentes,
 * sobrescrevem os campos i18n; ausência mantém valor atual.
 */
@Service
@RequiredArgsConstructor
public class UpdateSubscriptionPlanUseCase {
    private final SubscriptionPlanRepositoryPort planRepository;
    private final CacheInvalidationPort cacheInvalidation;

    @Transactional
    public SubscriptionPlan execute(UUID planId, Long priceInCents,
                                     Map<String, String> description,
                                     Map<String, List<String>> features,
                                     Boolean active,
                                     Map<String, Long> prices) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));

        if (priceInCents != null) plan.setPriceInCents(priceInCents);
        if (description != null) plan.setDescription(LocalizedString.of(description));
        if (features != null) plan.setFeatures(LocalizedStringList.of(features));
        if (active != null) plan.setActive(active);
        if (prices != null && !prices.isEmpty()) {
            plan.setPrices(new java.util.HashMap<>(prices));
            Long brl = prices.get("BRL");
            if (brl != null) plan.setPriceInCents(brl);
        }

        SubscriptionPlan saved = planRepository.save(plan);
        cacheInvalidation.clearAfterCommit(CacheNames.SUBSCRIPTION_PLANS);
        return saved;
    }
}
