package com.mangareader.presentation.admin.dto;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Resumo financeiro agregado para o painel admin.
 */
public record FinancialSummaryResponse(
        long totalPayments,
        BigDecimal totalRevenue,
        BigDecimal pendingRevenue,
        Map<String, Long> countsByStatus,
        Map<String, BigDecimal> amountsByStatus
) {
}
