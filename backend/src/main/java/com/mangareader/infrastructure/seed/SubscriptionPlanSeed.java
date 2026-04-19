package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionPlanJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class SubscriptionPlanSeed implements EntitySeeder {
    private final SubscriptionPlanJpaRepository planRepository;

    @Override
    public int getOrder() {
        return 13;
    }

    @Override
    public void seed() {
        if (planRepository.count() > 0) {
            log.info("Planos de assinatura já existem — seed de plans ignorado.");

            return;
        }

        var plans = List.of(
                SubscriptionPlan.builder()
                        .period(SubscriptionPeriod.DAILY)
                        .priceInCents(39)
                        .description("Acesso diário a todos os títulos premium por 24h.")
                        .features(List.of("Leitura ilimitada por 24h", "Sem anúncios"))
                        .active(true)
                        .build(),
                SubscriptionPlan.builder()
                        .period(SubscriptionPeriod.MONTHLY)
                        .priceInCents(1990)
                        .description("Assinatura mensal com acesso completo ao catálogo premium.")
                        .features(List.of("Leitura ilimitada", "Sem anúncios", "Download offline", "Lançamentos antecipados"))
                        .active(true)
                        .build(),
                SubscriptionPlan.builder()
                        .period(SubscriptionPeriod.ANNUAL)
                        .priceInCents(19900)
                        .description("Plano anual com desconto — equivale a 10 meses.")
                        .features(List.of("Leitura ilimitada", "Sem anúncios", "Download offline", "Lançamentos antecipados", "Badge exclusivo", "Acesso a eventos VIP"))
                        .active(true)
                        .build()
        );

        planRepository.saveAll(plans);

        log.info("✓ {} planos de assinatura de demonstração criados.", plans.size());
    }
}
