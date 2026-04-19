package com.mangareader.application.subscription;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.subscription.port.GiftCodeRepositoryPort;
import com.mangareader.application.subscription.port.PaymentGatewayPort;
import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.application.subscription.usecase.CreateGiftCodeUseCase;
import com.mangareader.application.subscription.usecase.CreateSubscriptionUseCase;
import com.mangareader.application.subscription.usecase.GetSubscriptionPlansUseCase;
import com.mangareader.application.subscription.usecase.RedeemGiftCodeUseCase;
import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.GiftCodeStatus;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("Subscription Use Cases")
class SubscriptionUseCasesTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID PLAN_ID = UUID.randomUUID();

    private static SubscriptionPlan buildMonthlyPlan() {
        return SubscriptionPlan.builder()
                .id(PLAN_ID)
                .period(SubscriptionPeriod.MONTHLY)
                .priceInCents(1990L)
                .description("Plano Mensal")
                .features(List.of("HD", "Offline"))
                .build();
    }

    @Nested
    @DisplayName("GetSubscriptionPlansUseCase")
    class GetPlans {

        @Mock
        private SubscriptionPlanRepositoryPort planRepository;

        @InjectMocks
        private GetSubscriptionPlansUseCase useCase;

        @Test
        @DisplayName("Deve retornar lista de planos ativos")
        void deveRetornarPlanosAtivos() {
            var plan = buildMonthlyPlan();
            when(planRepository.findAllActive()).thenReturn(List.of(plan));

            var result = useCase.execute();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPeriod()).isEqualTo(SubscriptionPeriod.MONTHLY);
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando não há planos ativos")
        void deveRetornarListaVaziaQuandoSemPlanos() {
            when(planRepository.findAllActive()).thenReturn(List.of());

            var result = useCase.execute();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("CreateSubscriptionUseCase")
    class CreateSubscription {

        @Mock
        private SubscriptionPlanRepositoryPort planRepository;
        @Mock
        private SubscriptionRepositoryPort subscriptionRepository;
        @Mock
        private PaymentGatewayPort paymentGateway;

        @InjectMocks
        private CreateSubscriptionUseCase useCase;

        @Test
        @DisplayName("Deve criar assinatura mensal com endDate = startDate + 1 mês")
        void deveCriarAssinaturaComEndDateCorreto() {
            var plan = buildMonthlyPlan();
            when(planRepository.findById(PLAN_ID)).thenReturn(Optional.of(plan));
            when(paymentGateway.createPaymentIntent(any(Long.class), any(), any())).thenReturn("stripe-mock-123");
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var result = useCase.execute(USER_ID, PLAN_ID);

            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
            assertThat(result.getExternalPaymentId()).isEqualTo("stripe-mock-123");
            assertThat(result.getEndDate()).isAfter(result.getStartDate());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando plano não existe")
        void deveLancarExcecaoQuandoPlanoNaoExiste() {
            when(planRepository.findById(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute(USER_ID, PLAN_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("CreateGiftCodeUseCase")
    class CreateGiftCode {

        @Mock
        private SubscriptionPlanRepositoryPort planRepository;
        @Mock
        private GiftCodeRepositoryPort giftCodeRepository;

        @InjectMocks
        private CreateGiftCodeUseCase useCase;

        @Test
        @DisplayName("Deve criar gift code com UUID aleatório e expiração em 1 ano")
        void deveCriarGiftCodeComCodigoUnico() {
            when(planRepository.findById(PLAN_ID)).thenReturn(Optional.of(buildMonthlyPlan()));
            when(giftCodeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var captor = ArgumentCaptor.forClass(GiftCode.class);
            useCase.execute(USER_ID, PLAN_ID, "recipient@email.com");
            verify(giftCodeRepository).save(captor.capture());

            GiftCode saved = captor.getValue();
            assertThat(saved.getCode()).isNotBlank();
            assertThat(saved.getRecipientEmail()).isEqualTo("recipient@email.com");
            assertThat(saved.getStatus()).isEqualTo(GiftCodeStatus.PENDING);
            assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now().plusDays(360));
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando plano não existe")
        void deveLancarExcecaoQuandoPlanoNaoExiste() {
            when(planRepository.findById(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute(USER_ID, PLAN_ID, "user@email.com"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("RedeemGiftCodeUseCase")
    class RedeemGiftCode {

        @Mock
        private GiftCodeRepositoryPort giftCodeRepository;
        @Mock
        private SubscriptionRepositoryPort subscriptionRepository;

        @InjectMocks
        private RedeemGiftCodeUseCase useCase;

        @Test
        @DisplayName("Deve resgatar código válido e marcar como REDEEMED")
        void deveResgatarCodigoValido() {
            var plan = buildMonthlyPlan();
            var giftCode = GiftCode.builder()
                    .code("valid-code")
                    .plan(plan)
                    .senderUserId(UUID.randomUUID())
                    .recipientEmail("user@email.com")
                    .expiresAt(LocalDateTime.now().plusYears(1))
                    .build();
            when(giftCodeRepository.findByCode("valid-code")).thenReturn(Optional.of(giftCode));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(giftCodeRepository.save(any())).thenReturn(giftCode);

            var result = useCase.execute(USER_ID, "valid-code");

            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
            assertThat(giftCode.getStatus()).isEqualTo(GiftCodeStatus.REDEEMED);
            assertThat(giftCode.getRedeemedByUserId()).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando código não existe")
        void deveLancarExcecaoQuandoCodigoNaoExiste() {
            when(giftCodeRepository.findByCode(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute(USER_ID, "inexistente"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando código já foi usado")
        void deveLancarExcecaoQuandoCodigoJaFoiUsado() {
            var giftCode = GiftCode.builder()
                    .code("used-code")
                    .plan(buildMonthlyPlan())
                    .senderUserId(UUID.randomUUID())
                    .recipientEmail("user@email.com")
                    .expiresAt(LocalDateTime.now().plusYears(1))
                    .status(GiftCodeStatus.REDEEMED)
                    .build();
            when(giftCodeRepository.findByCode("used-code")).thenReturn(Optional.of(giftCode));

            assertThatThrownBy(() -> useCase.execute(USER_ID, "used-code"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("utilizado");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException quando código está expirado")
        void deveLancarExcecaoQuandoCodigoExpirado() {
            var giftCode = GiftCode.builder()
                    .code("expired-code")
                    .plan(buildMonthlyPlan())
                    .senderUserId(UUID.randomUUID())
                    .recipientEmail("user@email.com")
                    .expiresAt(LocalDateTime.now().minusDays(1))
                    .build();
            when(giftCodeRepository.findByCode("expired-code")).thenReturn(Optional.of(giftCode));

            assertThatThrownBy(() -> useCase.execute(USER_ID, "expired-code"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("expirado");
        }
    }
}
