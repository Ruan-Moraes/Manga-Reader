package com.mangareader.application.subscription.usecase.admin;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo plano de assinatura (admin). Aceita campos legados String/List e
 * os novos mapas i18n; ambos coexistem na entidade durante Fase A.
 */
@Service
@RequiredArgsConstructor
public class CreateSubscriptionPlanUseCase {
    private final SubscriptionPlanRepositoryPort planRepository;

    @Transactional
    public SubscriptionPlan execute(SubscriptionPeriod period, long priceInCents,
                                     String description, List<String> features,
                                     Map<String, String> descriptionI18n,
                                     Map<String, List<String>> featuresI18n,
                                     Map<String, Long> prices) {
        var resolvedPrices = prices != null && !prices.isEmpty() ? prices : Map.of("BRL", priceInCents);
        var brlPrice = resolvedPrices.getOrDefault("BRL", priceInCents);

        var plan = SubscriptionPlan.builder()
                .period(period)
                .priceInCents(brlPrice)
                .description(description)
                .features(features != null ? features : List.of())
                .descriptionI18n(descriptionI18n != null
                        ? LocalizedString.of(descriptionI18n)
                        : LocalizedString.empty())
                .featuresI18n(featuresI18n != null
                        ? LocalizedStringList.of(featuresI18n)
                        : LocalizedStringList.empty())
                .prices(new java.util.HashMap<>(resolvedPrices))
                .active(true)
                .build();

        return planRepository.save(plan);
    }
}
