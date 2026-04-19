package com.mangareader.application.payment.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.payment.port.PaymentRepositoryPort;
import com.mangareader.domain.payment.valueobject.PaymentStatus;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetFinancialSummaryUseCase")
class GetFinancialSummaryUseCaseTest {

    @Mock
    private PaymentRepositoryPort paymentRepository;

    @InjectMocks
    private GetFinancialSummaryUseCase useCase;

    @Test
    @DisplayName("Deve agregar contagens e valores por status")
    void deveAgregarPorStatus() {
        when(paymentRepository.count()).thenReturn(10L);
        when(paymentRepository.countByStatus(PaymentStatus.PENDING)).thenReturn(3L);
        when(paymentRepository.countByStatus(PaymentStatus.COMPLETED)).thenReturn(5L);
        when(paymentRepository.countByStatus(PaymentStatus.FAILED)).thenReturn(1L);
        when(paymentRepository.countByStatus(PaymentStatus.REFUNDED)).thenReturn(1L);
        when(paymentRepository.sumAmountByStatus(PaymentStatus.PENDING)).thenReturn(new BigDecimal("150.00"));
        when(paymentRepository.sumAmountByStatus(PaymentStatus.COMPLETED)).thenReturn(new BigDecimal("500.00"));
        when(paymentRepository.sumAmountByStatus(PaymentStatus.FAILED)).thenReturn(new BigDecimal("20.00"));
        when(paymentRepository.sumAmountByStatus(PaymentStatus.REFUNDED)).thenReturn(new BigDecimal("30.00"));

        var summary = useCase.execute();

        assertThat(summary.totalPayments()).isEqualTo(10L);
        assertThat(summary.totalRevenue()).isEqualByComparingTo("500.00");
        assertThat(summary.pendingRevenue()).isEqualByComparingTo("150.00");
        assertThat(summary.countsByStatus()).containsEntry(PaymentStatus.COMPLETED, 5L);
        assertThat(summary.countsByStatus()).containsEntry(PaymentStatus.PENDING, 3L);
        assertThat(summary.amountsByStatus()).containsEntry(PaymentStatus.REFUNDED, new BigDecimal("30.00"));
    }
}
