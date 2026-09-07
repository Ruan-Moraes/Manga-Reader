package com.toonlira.presentation.admin.dto;

/**
 * Resumo de contagens de assinaturas por status (admin dashboard).
 */
public record SubscriptionSummaryResponse(
        long totalActive,
        long totalExpired,
        long totalCancelled
) {}
