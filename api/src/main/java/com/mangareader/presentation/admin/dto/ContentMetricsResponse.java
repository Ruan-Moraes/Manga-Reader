package com.mangareader.presentation.admin.dto;

import java.util.List;
import java.util.Map;

/**
 * Métricas de conteúdo para o dashboard admin aprimorado.
 */
public record ContentMetricsResponse(
        Map<String, Long> titlesByStatus,
        Map<String, Long> eventsByStatus,
        List<TopTitleResponse> topTitles
) {
    public record TopTitleResponse(
            String id,
            String name,
            String cover,
            String type,
            Double rankingScore,
            Double ratingAverage,
            Long ratingCount
    ) {
    }
}
