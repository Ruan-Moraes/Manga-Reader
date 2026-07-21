package com.mangareader.application.subscription.usecase.admin;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.application.shared.port.CacheInvalidationPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;
import com.mangareader.shared.constant.CacheNames;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo plano de assinatura (admin). Mapas multilíngues para
 * description (LocalizedString) e features (LocalizedStringList).
 */
@Service
@RequiredArgsConstructor
public class CreateSubscriptionPlanUseCase {
    private final SubscriptionPlanRepositoryPort planRepository;
    private final CacheInvalidationPort cacheInvalidation;

    @Transactional
    public SubscriptionPlan execute(SubscriptionPeriod period, long priceInCents,
                                     Map<String, String> description,
                                     Map<String, List<String>> features,
                                     Map<String, Long> prices) {
        var resolvedPrices = prices != null && !prices.isEmpty() ? prices : Map.of("BRL", priceInCents);
        var brlPrice = resolvedPrices.getOrDefault("BRL", priceInCents);

        var plan = SubscriptionPlan.builder()
                .period(period)
                .priceInCents(brlPrice)
                .description(description != null && !description.isEmpty()
                        ? LocalizedString.of(description)
                        : LocalizedString.empty())
                .features(features != null && !features.isEmpty()
                        ? LocalizedStringList.of(features)
                        : LocalizedStringList.empty())
                .prices(new java.util.HashMap<>(resolvedPrices))
                .active(true)
                .build();

        SubscriptionPlan saved = planRepository.save(plan);
        cacheInvalidation.clearAfterCommit(CacheNames.SUBSCRIPTION_PLANS);
        return saved;
    }
}
