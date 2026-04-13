package com.mangareader.infrastructure.seed;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionAuditLog;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.GiftCodeStatus;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.infrastructure.persistence.postgres.repository.GiftCodeJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionAuditLogJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionPlanJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class SubscriptionSeed implements EntitySeeder {
    private final SubscriptionJpaRepository subscriptionRepository;
    private final SubscriptionPlanJpaRepository planRepository;
    private final GiftCodeJpaRepository giftCodeRepository;
    private final SubscriptionAuditLogJpaRepository auditLogRepository;
    private final UserJpaRepository userRepository;

    @Override
    public int getOrder() {
        return 14;
    }

    @Override
    public void seed() {
        if (subscriptionRepository.count() > 0) {
            log.info("Assinaturas de usuários já existem — seed de subscriptions ignorado.");

            return;
        }

        var users = userRepository.findAll();
        var plans = planRepository.findAll();

        if (users.size() < 4 || plans.size() < 3) return;

        var now = LocalDateTime.now();
        var user1 = users.get(0);
        var user2 = users.get(1);
        var user3 = users.get(2);
        var admin = users.get(3);
        var roberta = users.size() > 4 ? users.get(4) : user1;

        SubscriptionPlan dailyPlan = findByPeriod(plans, SubscriptionPeriod.DAILY);
        SubscriptionPlan monthlyPlan = findByPeriod(plans, SubscriptionPeriod.MONTHLY);
        SubscriptionPlan annualPlan = findByPeriod(plans, SubscriptionPeriod.ANNUAL);

        var sub1 = Subscription.builder()
                .userId(user1.getId())
                .plan(monthlyPlan)
                .startDate(now.minusDays(15))
                .endDate(now.plusDays(15))
                .status(SubscriptionStatus.ACTIVE)
                .externalPaymentId("pi_demo_monthly_001")
                .build();

        var sub2 = Subscription.builder()
                .userId(user2.getId())
                .plan(annualPlan)
                .startDate(now.minusMonths(6))
                .endDate(now.plusMonths(6))
                .status(SubscriptionStatus.ACTIVE)
                .externalPaymentId("pi_demo_annual_001")
                .build();

        var sub3 = Subscription.builder()
                .userId(user3.getId())
                .plan(monthlyPlan)
                .startDate(now.minusDays(45))
                .endDate(now.minusDays(15))
                .status(SubscriptionStatus.EXPIRED)
                .externalPaymentId("pi_demo_monthly_002")
                .build();

        var sub4 = Subscription.builder()
                .userId(admin.getId())
                .plan(annualPlan)
                .startDate(now.minusMonths(2))
                .endDate(now.plusMonths(10))
                .status(SubscriptionStatus.ACTIVE)
                .externalPaymentId("pi_demo_annual_admin")
                .build();

        var sub5 = Subscription.builder()
                .userId(roberta.getId())
                .plan(monthlyPlan)
                .startDate(now.minusDays(30))
                .endDate(now)
                .status(SubscriptionStatus.CANCELLED)
                .externalPaymentId("pi_demo_monthly_003")
                .build();

        var sub6 = Subscription.builder()
                .userId(user1.getId())
                .plan(dailyPlan)
                .startDate(now.minusDays(2))
                .endDate(now.minusDays(1))
                .status(SubscriptionStatus.EXPIRED)
                .externalPaymentId("pi_demo_daily_001")
                .build();

        var sub7 = Subscription.builder()
                .userId(user2.getId())
                .plan(dailyPlan)
                .startDate(now)
                .endDate(now.plusDays(1))
                .status(SubscriptionStatus.ACTIVE)
                .externalPaymentId("pi_demo_daily_002")
                .build();

        var sub8 = Subscription.builder()
                .userId(user3.getId())
                .plan(annualPlan)
                .startDate(now.minusYears(1).minusMonths(2))
                .endDate(now.minusMonths(2))
                .status(SubscriptionStatus.EXPIRED)
                .externalPaymentId("pi_demo_annual_002")
                .build();

        var sub9 = Subscription.builder()
                .userId(roberta.getId())
                .plan(annualPlan)
                .startDate(now.minusDays(10))
                .endDate(now.plusMonths(11).plusDays(20))
                .status(SubscriptionStatus.ACTIVE)
                .build();

        var sub10 = Subscription.builder()
                .userId(user1.getId())
                .plan(monthlyPlan)
                .startDate(now.minusMonths(3))
                .endDate(now.minusMonths(2))
                .status(SubscriptionStatus.CANCELLED)
                .externalPaymentId("pi_demo_monthly_004")
                .build();

        subscriptionRepository.saveAll(List.of(sub1, sub2, sub3, sub4, sub5, sub6, sub7, sub8, sub9, sub10));

        var gift1 = GiftCode.builder()
                .code(UUID.randomUUID().toString())
                .plan(monthlyPlan)
                .senderUserId(user1.getId())
                .recipientEmail("amigo@email.com")
                .expiresAt(now.plusDays(30))
                .status(GiftCodeStatus.PENDING)
                .build();

        var gift2 = GiftCode.builder()
                .code(UUID.randomUUID().toString())
                .plan(annualPlan)
                .senderUserId(admin.getId())
                .recipientEmail("mika@mangareader.com")
                .redeemedByUserId(user2.getId())
                .redeemedAt(now.minusDays(5))
                .expiresAt(now.plusDays(25))
                .status(GiftCodeStatus.REDEEMED)
                .build();

        var gift3 = GiftCode.builder()
                .code(UUID.randomUUID().toString())
                .plan(dailyPlan)
                .senderUserId(user3.getId())
                .recipientEmail("expirado@email.com")
                .expiresAt(now.minusDays(10))
                .status(GiftCodeStatus.EXPIRED)
                .build();

        var gift4 = GiftCode.builder()
                .code(UUID.randomUUID().toString())
                .plan(monthlyPlan)
                .senderUserId(roberta.getId())
                .recipientEmail("carlos@mangareader.com")
                .expiresAt(now.plusDays(15))
                .status(GiftCodeStatus.PENDING)
                .build();

        var gift5 = GiftCode.builder()
                .code(UUID.randomUUID().toString())
                .plan(annualPlan)
                .senderUserId(user2.getId())
                .recipientEmail("sofia@mangareader.com")
                .redeemedByUserId(users.size() > 8 ? users.get(8).getId() : user1.getId())
                .redeemedAt(now.minusDays(1))
                .expiresAt(now.plusDays(29))
                .status(GiftCodeStatus.REDEEMED)
                .build();

        giftCodeRepository.saveAll(List.of(gift1, gift2, gift3, gift4, gift5));

        var logs = List.of(
                SubscriptionAuditLog.builder()
                        .subscriptionId(sub1.getId()).userId(user1.getId())
                        .action("CREATED").performedBy(user1.getId())
                        .details("Assinatura mensal criada via PIX.").build(),
                SubscriptionAuditLog.builder()
                        .subscriptionId(sub3.getId()).userId(user3.getId())
                        .action("EXPIRED").performedBy(null)
                        .details("Assinatura expirada automaticamente.").build(),
                SubscriptionAuditLog.builder()
                        .subscriptionId(sub5.getId()).userId(roberta.getId())
                        .action("CANCELLED").performedBy(roberta.getId())
                        .details("Cancelamento solicitado pelo usuário.").build(),
                SubscriptionAuditLog.builder()
                        .subscriptionId(sub4.getId()).userId(admin.getId())
                        .action("GRANTED").performedBy(admin.getId())
                        .details("Plano anual concedido pelo admin.").build(),
                SubscriptionAuditLog.builder()
                        .subscriptionId(sub2.getId()).userId(user2.getId())
                        .action("STATUS_CHANGED").performedBy(admin.getId())
                        .details("Status alterado de EXPIRED para ACTIVE pelo admin.").build()
        );

        auditLogRepository.saveAll(logs);

        log.info("✓ 10 assinaturas, 5 gift codes e 5 audit logs de demonstração criados.");
    }

    private SubscriptionPlan findByPeriod(List<SubscriptionPlan> plans, SubscriptionPeriod period) {
        return plans.stream()
                .filter(p -> p.getPeriod() == period)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Plano " + period + " não encontrado."));
    }
}
