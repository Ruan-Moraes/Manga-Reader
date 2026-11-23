package com.toonlira.presentation.admin.mapper;

import java.util.LinkedHashMap;
import java.util.Map;

import com.toonlira.application.payment.usecase.admin.GetFinancialSummaryUseCase.FinancialSummary;
import com.toonlira.domain.payment.entity.Payment;
import com.toonlira.presentation.admin.dto.AdminPaymentResponse;
import com.toonlira.presentation.admin.dto.FinancialSummaryResponse;

/**
 * Mapper estático Payment → AdminPaymentResponse e FinancialSummary → FinancialSummaryResponse.
 */
public final class AdminPaymentMapper {

    private AdminPaymentMapper() {
    }

    public static AdminPaymentResponse toResponse(Payment payment) {
        return new AdminPaymentResponse(
                payment.getId(),
                payment.getUserId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus() != null ? payment.getStatus().name() : null,
                payment.getPaymentMethod(),
                payment.getDescription(),
                payment.getReferenceType(),
                payment.getReferenceId(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    public static FinancialSummaryResponse toSummaryResponse(FinancialSummary summary) {
        Map<String, Long> counts = new LinkedHashMap<>();
        summary.countsByStatus().forEach((k, v) -> counts.put(k.name(), v));

        Map<String, java.math.BigDecimal> amounts = new LinkedHashMap<>();
        summary.amountsByStatus().forEach((k, v) -> amounts.put(k.name(), v));

        return new FinancialSummaryResponse(
                summary.totalPayments(),
                summary.totalRevenue(),
                summary.pendingRevenue(),
                counts,
                amounts
        );
    }
}
