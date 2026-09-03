package com.mangareader.infrastructure.seed;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionPlanJpaRepository;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

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

    private static LocalizedString ls(String pt, String en, String es) {
        return LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
    }

    private static LocalizedStringList lsl(List<String> pt, List<String> en, List<String> es) {
        return LocalizedStringList.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
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
                        .prices(new HashMap<>(Map.of("BRL", 39L, "USD", 9L, "EUR", 9L)))
                        .description(ls(
                                "Acesso diário a todos os títulos premium por 24h.",
                                "Daily access to all premium titles for 24h.",
                                "Acceso diario a todos los títulos premium por 24h."))
                        .features(lsl(
                                List.of("Leitura ilimitada por 24h", "Sem anúncios"),
                                List.of("Unlimited reading for 24h", "Ad-free"),
                                List.of("Lectura ilimitada por 24h", "Sin anuncios")))
                        .active(true)
                        .build(),
                SubscriptionPlan.builder()
                        .period(SubscriptionPeriod.MONTHLY)
                        .priceInCents(1990)
                        .prices(new HashMap<>(Map.of("BRL", 1990L, "USD", 399L, "EUR", 379L)))
                        .description(ls(
                                "Assinatura mensal com acesso completo ao catálogo premium.",
                                "Monthly subscription with full access to the premium catalog.",
                                "Suscripción mensual con acceso completo al catálogo premium."))
                        .features(lsl(
                                List.of("Leitura ilimitada", "Sem anúncios", "Download offline", "Lançamentos antecipados"),
                                List.of("Unlimited reading", "Ad-free", "Offline download", "Early releases"),
                                List.of("Lectura ilimitada", "Sin anuncios", "Descarga offline", "Lanzamientos anticipados")))
                        .active(true)
                        .build(),
                SubscriptionPlan.builder()
                        .period(SubscriptionPeriod.ANNUAL)
                        .priceInCents(19900)
                        .prices(new HashMap<>(Map.of("BRL", 19900L, "USD", 3990L, "EUR", 3790L)))
                        .description(ls(
                                "Plano anual com desconto — equivale a 10 meses.",
                                "Annual plan with a discount — equivalent to 10 months.",
                                "Plan anual con descuento — equivale a 10 meses."))
                        .features(lsl(
                                List.of("Leitura ilimitada", "Sem anúncios", "Download offline", "Lançamentos antecipados", "Badge exclusivo", "Acesso a eventos VIP"),
                                List.of("Unlimited reading", "Ad-free", "Offline download", "Early releases", "Exclusive badge", "VIP event access"),
                                List.of("Lectura ilimitada", "Sin anuncios", "Descarga offline", "Lanzamientos anticipados", "Insignia exclusiva", "Acceso a eventos VIP")))
                        .active(true)
                        .build()
        );

        planRepository.saveAll(plans);

        log.info("✓ {} planos de assinatura de demonstração criados.", plans.size());
    }
}
