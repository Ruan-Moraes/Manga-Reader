package com.mangareader.application.payment.usecase.admin;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.payment.port.PaymentRepositoryPort;
import com.mangareader.domain.payment.valueobject.PaymentStatus;

import lombok.RequiredArgsConstructor;

/**
 * Agrega métricas financeiras para o dashboard admin.
 */
@Service
@RequiredArgsConstructor
public class GetFinancialSummaryUseCase {

    private final PaymentRepositoryPort paymentRepository;

    @Transactional(readOnly = true)
    public FinancialSummary execute() {
        Map<PaymentStatus, Long> countsByStatus = new EnumMap<>(PaymentStatus.class);
        Map<PaymentStatus, BigDecimal> amountsByStatus = new EnumMap<>(PaymentStatus.class);

        for (PaymentStatus status : PaymentStatus.values()) {
            countsByStatus.put(status, paymentRepository.countByStatus(status));
            amountsByStatus.put(status, paymentRepository.sumAmountByStatus(status));
        }

        long totalPayments = paymentRepository.count();
        BigDecimal totalRevenue = amountsByStatus.get(PaymentStatus.COMPLETED);
        BigDecimal pendingRevenue = amountsByStatus.get(PaymentStatus.PENDING);

        return new FinancialSummary(
                totalPayments,
                totalRevenue,
                pendingRevenue,
                countsByStatus,
                amountsByStatus);
    }

    public record FinancialSummary(
            long totalPayments,
            BigDecimal totalRevenue,
            BigDecimal pendingRevenue,
            Map<PaymentStatus, Long> countsByStatus,
            Map<PaymentStatus, BigDecimal> amountsByStatus
    ) {}
}
