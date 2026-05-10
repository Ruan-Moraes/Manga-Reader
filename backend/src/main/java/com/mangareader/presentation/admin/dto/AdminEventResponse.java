package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Resposta admin de evento. Campos title/subtitle/description expostos como
 * mapas multilíngues para edição.
 */
public record AdminEventResponse(
        UUID id,
        Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> description,
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
