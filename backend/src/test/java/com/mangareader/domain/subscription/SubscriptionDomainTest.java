package com.mangareader.domain.subscription;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.GiftCodeStatus;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

@DisplayName("Subscription domain entities and enums")
class SubscriptionDomainTest {

    @Nested
    @DisplayName("SubscriptionPeriod")
    class SubscriptionPeriodTests {

        @Test
        @DisplayName("Deve conter DAILY, MONTHLY e ANNUAL")
        void shouldContainAllPeriods() {
            var periods = SubscriptionPeriod.values();
            assertThat(periods).containsExactly(
                    SubscriptionPeriod.DAILY,
                    SubscriptionPeriod.MONTHLY,
                    SubscriptionPeriod.ANNUAL
            );
        }
    }

    @Nested
    @DisplayName("SubscriptionStatus")
    class SubscriptionStatusTests {

        @Test
        @DisplayName("Deve conter ACTIVE, EXPIRED e CANCELLED")
        void shouldContainAllStatuses() {
            var statuses = SubscriptionStatus.values();
            assertThat(statuses).containsExactly(
                    SubscriptionStatus.ACTIVE,
                    SubscriptionStatus.EXPIRED,
                    SubscriptionStatus.CANCELLED
            );
        }
    }

    @Nested
    @DisplayName("GiftCodeStatus")
    class GiftCodeStatusTests {

        @Test
        @DisplayName("Deve conter PENDING, REDEEMED e EXPIRED")
        void shouldContainAllStatuses() {
            var statuses = GiftCodeStatus.values();
            assertThat(statuses).containsExactly(
                    GiftCodeStatus.PENDING,
                    GiftCodeStatus.REDEEMED,
                    GiftCodeStatus.EXPIRED
            );
        }
    }

    @Nested
    @DisplayName("SubscriptionPlan")
    class SubscriptionPlanTests {

        @Test
        @DisplayName("Deve inicializar active=true e features=[] via @Builder.Default")
        void shouldInitializeDefaults() {
            var plan = SubscriptionPlan.builder()
                    .period(SubscriptionPeriod.MONTHLY)
                    .priceInCents(1990L)
                    .description("Plano Mensal")
                    .build();

            assertThat(plan.isActive()).isTrue();
            assertThat(plan.getFeatures()).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("Deve aceitar features customizadas")
        void shouldAcceptCustomFeatures() {
            var plan = SubscriptionPlan.builder()
                    .period(SubscriptionPeriod.ANNUAL)
                    .priceInCents(15990L)
                    .description("Plano Anual")
                    .features(List.of("HD", "Offline"))
                    .build();

            assertThat(plan.getFeatures()).containsExactly("HD", "Offline");
        }
    }

    @Nested
    @DisplayName("GiftCode")
    class GiftCodeTests {

        @Test
        @DisplayName("Deve inicializar status=PENDING via @Builder.Default")
        void shouldInitializeStatusAsPending() {
            var gift = GiftCode.builder()
                    .code("abc-123")
                    .senderUserId(java.util.UUID.randomUUID())
                    .recipientEmail("user@email.com")
                    .expiresAt(java.time.LocalDateTime.now().plusYears(1))
                    .build();

            assertThat(gift.getStatus()).isEqualTo(GiftCodeStatus.PENDING);
        }
    }
}
