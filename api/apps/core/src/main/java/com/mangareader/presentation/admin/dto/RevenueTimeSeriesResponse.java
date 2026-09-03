package com.mangareader.presentation.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public record RevenueTimeSeriesResponse(
        List<MonthlyRevenueEntry> entries,
        BigDecimal totalRevenue,
        int totalTransactions
) {
    public record MonthlyRevenueEntry(
            String yearMonth,
            BigDecimal revenue,
            int count,
            BigDecimal growthPercent
    ) {
    }
}
