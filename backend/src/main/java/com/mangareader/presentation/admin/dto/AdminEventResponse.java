package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Resposta de um evento para o painel admin.
 */
public record AdminEventResponse(
        UUID id,
        String title,
        String subtitle,
        String description,
        String image,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String timezone,
        String timeline,
        String status,
        String type,
        String locationLabel,
        String locationCity,
        boolean locationIsOnline,
        String organizerName,
        String priceLabel,
        int participants,
        int interested,
        boolean isFeatured,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
