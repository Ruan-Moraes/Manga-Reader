package com.mangareader.application.subscription.usecase.admin;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um plano de assinatura existente (admin). Mapas *I18n, quando
 * presentes, sobrescrevem os campos i18n; ausência mantém valor atual.
 */
@Service
@RequiredArgsConstructor
public class UpdateSubscriptionPlanUseCase {
    private final SubscriptionPlanRepositoryPort planRepository;

    @Transactional
    public SubscriptionPlan execute(UUID planId, Long priceInCents, String description,
                                     List<String> features,
                                     Map<String, String> descriptionI18n,
                                     Map<String, List<String>> featuresI18n,
                                     Boolean active,
                                     Map<String, Long> prices) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));

        if (priceInCents != null) plan.setPriceInCents(priceInCents);
        if (description != null) plan.setDescription(description);
        if (features != null) plan.setFeatures(features);
        if (descriptionI18n != null) plan.setDescriptionI18n(LocalizedString.of(descriptionI18n));
        if (featuresI18n != null) plan.setFeaturesI18n(LocalizedStringList.of(featuresI18n));
        if (active != null) plan.setActive(active);
        if (prices != null && !prices.isEmpty()) {
            plan.setPrices(new java.util.HashMap<>(prices));
            Long brl = prices.get("BRL");
            if (brl != null) plan.setPriceInCents(brl);
        }

        return planRepository.save(plan);
    }
}
