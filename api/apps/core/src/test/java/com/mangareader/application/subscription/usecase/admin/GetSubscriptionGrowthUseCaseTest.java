package com.mangareader.application.subscription.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.YearMonth;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetSubscriptionGrowthUseCase")
class GetSubscriptionGrowthUseCaseTest {

    @Mock
    private SubscriptionRepositoryPort subscriptionRepository;

    @InjectMocks
    private GetSubscriptionGrowthUseCase useCase;

    @Test
    @DisplayName("Deve retornar série vazia quando não há assinaturas")
    void deveRetornarSerieVaziaQuandoNaoHaAssinaturas() {
        when(subscriptionRepository.countNewSubscriptionsByMonth(any())).thenReturn(List.of());
        when(subscriptionRepository.countCancelledSubscriptionsByMonth(any())).thenReturn(List.of());

        var result = useCase.execute(6);

        assertThat(result.entries()).hasSize(6);
        assertThat(result.totalNew()).isZero();
        assertThat(result.totalCancelled()).isZero();
        result.entries().forEach(e -> {
            assertThat(e.newSubscriptions()).isZero();
            assertThat(e.cancelledSubscriptions()).isZero();
            assertThat(e.netGrowth()).isZero();
        });
    }

    @Test
    @DisplayName("Deve agregar novas e canceladas corretamente")
    void deveAgregarNovasECanceladasCorretamente() {
        YearMonth now = YearMonth.now();
        Object[] newRow = new Object[]{
                now.getYear(), now.getMonthValue(), 15L
        };
        Object[] cancelledRow = new Object[]{
                now.getYear(), now.getMonthValue(), 3L
        };

        when(subscriptionRepository.countNewSubscriptionsByMonth(any()))
                .thenReturn(List.<Object[]>of(newRow));
        when(subscriptionRepository.countCancelledSubscriptionsByMonth(any()))
                .thenReturn(List.<Object[]>of(cancelledRow));

        var result = useCase.execute(3);

        assertThat(result.entries()).hasSize(3);
        assertThat(result.totalNew()).isEqualTo(15);
        assertThat(result.totalCancelled()).isEqualTo(3);

        var lastEntry = result.entries().get(result.entries().size() - 1);
        assertThat(lastEntry.newSubscriptions()).isEqualTo(15);
        assertThat(lastEntry.cancelledSubscriptions()).isEqualTo(3);
        assertThat(lastEntry.netGrowth()).isEqualTo(12);
    }

    @Test
    @DisplayName("Deve calcular net growth negativo quando cancelamentos superam novas")
    void deveCalcularNetGrowthNegativo() {
        YearMonth now = YearMonth.now();
        Object[] newRow = new Object[]{
                now.getYear(), now.getMonthValue(), 2L
        };
        Object[] cancelledRow = new Object[]{
                now.getYear(), now.getMonthValue(), 10L
        };

        when(subscriptionRepository.countNewSubscriptionsByMonth(any()))
                .thenReturn(List.<Object[]>of(newRow));
        when(subscriptionRepository.countCancelledSubscriptionsByMonth(any()))
                .thenReturn(List.<Object[]>of(cancelledRow));

        var result = useCase.execute(1);

        assertThat(result.entries()).hasSize(1);
        var entry = result.entries().get(0);
        assertThat(entry.netGrowth()).isEqualTo(-8);
    }

    @Test
    @DisplayName("Deve preencher meses sem dados com zeros")
    void devePreencherMesesSemDadosComZeros() {
        YearMonth now = YearMonth.now();
        Object[] newRow = new Object[]{
                now.getYear(), now.getMonthValue(), 5L
        };

        when(subscriptionRepository.countNewSubscriptionsByMonth(any()))
                .thenReturn(List.<Object[]>of(newRow));
        when(subscriptionRepository.countCancelledSubscriptionsByMonth(any()))
                .thenReturn(List.of());

        var result = useCase.execute(6);

        assertThat(result.entries()).hasSize(6);
        long emptyMonths = result.entries().stream()
                .filter(e -> e.newSubscriptions() == 0 && e.cancelledSubscriptions() == 0)
                .count();
        assertThat(emptyMonths).isEqualTo(5);
    }
}
