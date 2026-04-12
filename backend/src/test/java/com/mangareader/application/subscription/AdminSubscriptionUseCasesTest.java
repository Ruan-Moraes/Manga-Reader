package com.mangareader.application.subscription;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.application.subscription.usecase.admin.GetSubscriptionSummaryUseCase;
import com.mangareader.application.subscription.usecase.admin.ListSubscriptionsAdminUseCase;
import com.mangareader.application.subscription.usecase.admin.UpdateSubscriptionStatusAdminUseCase;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Subscription Use Cases")
class AdminSubscriptionUseCasesTest {

    private static final UUID SUBSCRIPTION_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    private static SubscriptionPlan buildPlan() {
        return SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .period(SubscriptionPeriod.MONTHLY)
                .priceInCents(1990L)
                .description("Mensal")
                .features(List.of("HD"))
                .build();
    }

    private static Subscription buildSubscription() {
        return Subscription.builder()
                .id(SUBSCRIPTION_ID)
                .userId(USER_ID)
                .plan(buildPlan())
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusMonths(1))
                .status(SubscriptionStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("ListSubscriptionsAdminUseCase")
    class ListSubscriptions {

        @Mock
        private SubscriptionRepositoryPort subscriptionRepository;

        @InjectMocks
        private ListSubscriptionsAdminUseCase useCase;

        @Test
        @DisplayName("Deve retornar página de assinaturas sem filtro")
        void deveRetornarPaginaSemFiltro() {
            var page = new PageImpl<>(List.of(buildSubscription()));
            when(subscriptionRepository.findAll(null, Pageable.unpaged())).thenReturn(page);

            var result = useCase.execute(null, Pageable.unpaged());

            assertThat(result.getContent()).hasSize(1);
            verify(subscriptionRepository).findAll(null, Pageable.unpaged());
        }

        @Test
        @DisplayName("Deve passar filtro de status ao repositório")
        void devePassarFiltroAoRepositorio() {
            var page = new PageImpl<>(List.of(buildSubscription()));
            when(subscriptionRepository.findAll(SubscriptionStatus.ACTIVE, Pageable.unpaged()))
                    .thenReturn(page);

            var result = useCase.execute(SubscriptionStatus.ACTIVE, Pageable.unpaged());

            assertThat(result.getContent()).hasSize(1);
            verify(subscriptionRepository).findAll(SubscriptionStatus.ACTIVE, Pageable.unpaged());
        }
    }

    @Nested
    @DisplayName("UpdateSubscriptionStatusAdminUseCase")
    class UpdateStatus {

        @Mock
        private SubscriptionRepositoryPort subscriptionRepository;

        @InjectMocks
        private UpdateSubscriptionStatusAdminUseCase useCase;

        @Test
        @DisplayName("Deve atualizar status e retornar assinatura atualizada")
        void deveAtualizarStatusERetornarAssinatura() {
            var subscription = buildSubscription();
            when(subscriptionRepository.findById(SUBSCRIPTION_ID)).thenReturn(Optional.of(subscription));
            when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var result = useCase.execute(SUBSCRIPTION_ID, SubscriptionStatus.CANCELLED);

            assertThat(result.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
            verify(subscriptionRepository).save(subscription);
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando assinatura não encontrada")
        void deveLancarExcecaoQuandoNaoEncontrado() {
            when(subscriptionRepository.findById(SUBSCRIPTION_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> useCase.execute(SUBSCRIPTION_ID, SubscriptionStatus.CANCELLED))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("GetSubscriptionSummaryUseCase")
    class GetSummary {

        @Mock
        private SubscriptionRepositoryPort subscriptionRepository;

        @InjectMocks
        private GetSubscriptionSummaryUseCase useCase;

        @Test
        @DisplayName("Deve retornar mapa de contagens por status")
        void deveRetornarContagensPorStatus() {
            Map<SubscriptionStatus, Long> counts = new EnumMap<>(SubscriptionStatus.class);
            counts.put(SubscriptionStatus.ACTIVE, 10L);
            counts.put(SubscriptionStatus.EXPIRED, 5L);
            when(subscriptionRepository.countByStatus()).thenReturn(counts);

            var result = useCase.execute();

            assertThat(result.get(SubscriptionStatus.ACTIVE)).isEqualTo(10L);
            assertThat(result.get(SubscriptionStatus.EXPIRED)).isEqualTo(5L);
        }
    }
}
