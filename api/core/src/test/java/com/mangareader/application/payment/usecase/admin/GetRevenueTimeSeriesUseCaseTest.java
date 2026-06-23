package com.mangareader.application.payment.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.payment.port.PaymentRepositoryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetRevenueTimeSeriesUseCase")
class GetRevenueTimeSeriesUseCaseTest {

    @Mock
    private PaymentRepositoryPort paymentRepository;

    @InjectMocks
    private GetRevenueTimeSeriesUseCase useCase;

    @Test
    @DisplayName("Deve retornar série vazia quando não há pagamentos")
    void deveRetornarSerieVaziaQuandoNaoHaPagamentos() {
        when(paymentRepository.getMonthlyRevenue(any())).thenReturn(List.of());

        var result = useCase.execute(6);

        assertThat(result.entries()).hasSize(6);
        assertThat(result.totalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.totalTransactions()).isZero();
        result.entries().forEach(e -> {
            assertThat(e.revenue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(e.count()).isZero();
        });
    }

    @Test
    @DisplayName("Deve agregar receita mensal corretamente")
    void deveAgregarReceitaMensalCorretamente() {
        YearMonth now = YearMonth.now();
        Object[] currentMonthRow = new Object[]{
                now.getYear(), now.getMonthValue(), new BigDecimal("15000.00"), 25L
        };
        Object[] prevMonthRow = new Object[]{
                now.minusMonths(1).getYear(), now.minusMonths(1).getMonthValue(),
                new BigDecimal("10000.00"), 20L
        };

        when(paymentRepository.getMonthlyRevenue(any()))
                .thenReturn(List.<Object[]>of(prevMonthRow, currentMonthRow));

        var result = useCase.execute(3);

        assertThat(result.entries()).hasSize(3);
        assertThat(result.totalRevenue()).isEqualByComparingTo(new BigDecimal("25000.00"));
        assertThat(result.totalTransactions()).isEqualTo(45);

        var lastEntry = result.entries().get(result.entries().size() - 1);
        assertThat(lastEntry.revenue()).isEqualByComparingTo(new BigDecimal("15000.00"));
        assertThat(lastEntry.count()).isEqualTo(25);
    }

    @Test
    @DisplayName("Deve calcular crescimento percentual entre meses")
    void deveCalcularCrescimentoPercentual() {
        YearMonth now = YearMonth.now();
        Object[] prevMonthRow = new Object[]{
                now.minusMonths(1).getYear(), now.minusMonths(1).getMonthValue(),
                new BigDecimal("10000.00"), 10L
        };
        Object[] currentMonthRow = new Object[]{
                now.getYear(), now.getMonthValue(), new BigDecimal("15000.00"), 15L
        };

        when(paymentRepository.getMonthlyRevenue(any()))
                .thenReturn(List.<Object[]>of(prevMonthRow, currentMonthRow));

        var result = useCase.execute(2);

        var lastEntry = result.entries().get(1);
        assertThat(lastEntry.growthPercent()).isEqualByComparingTo(new BigDecimal("50.00"));
    }

    @Test
    @DisplayName("Deve preencher meses sem dados com zeros")
    void devePreencherMesesSemDadosComZeros() {
        YearMonth now = YearMonth.now();
        Object[] row = new Object[]{
                now.getYear(), now.getMonthValue(), new BigDecimal("5000.00"), 5L
        };

        when(paymentRepository.getMonthlyRevenue(any())).thenReturn(List.<Object[]>of(row));

        var result = useCase.execute(6);

        assertThat(result.entries()).hasSize(6);
        long emptyMonths = result.entries().stream()
                .filter(e -> e.revenue().compareTo(BigDecimal.ZERO) == 0)
                .count();
        assertThat(emptyMonths).isEqualTo(5);
    }
}
