package com.mangareader.presentation.admin.dto;

import java.util.Map;

/**
 * Métricas agregadas para o dashboard admin.
 */
public record DashboardMetricsResponse(
        long totalUsers,
        long totalTitles,
        long totalGroups,
        long totalNews,
        long totalEvents,
        Map<String, Long> usersByRole,
        long bannedUsers
) {
}
