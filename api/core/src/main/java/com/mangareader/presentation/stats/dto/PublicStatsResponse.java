package com.mangareader.presentation.stats.dto;

/**
 * Resposta pública com métricas gerais da plataforma.
 */
public record PublicStatsResponse(
        long totalTitles,
        long totalChapters
) {}
