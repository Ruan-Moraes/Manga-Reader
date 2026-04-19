package com.mangareader.presentation.admin.dto;

import java.util.List;

public record SubscriptionGrowthResponse(
        List<MonthlyGrowthEntry> entries,
        long totalNew,
        long totalCancelled
) {
    public record MonthlyGrowthEntry(
            String yearMonth,
            long newSubscriptions,
            long cancelledSubscriptions,
            long netGrowth
    ) {
    }
}
