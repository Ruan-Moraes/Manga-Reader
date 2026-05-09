package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Resposta admin de evento. Campos *I18n trazem todas as traduções para edição
 * multilíngue. Campos String legados continuam preenchidos via fallback do mapper.
 */
public record AdminEventResponse(
        UUID id,
        String title,
        String subtitle,
        String description,
        Map<String, String> titleI18n,
        Map<String, String> subtitleI18n,
        Map<String, String> descriptionI18n,
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
