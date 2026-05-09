package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Request admin para atualização de evento. Todos os campos opcionais.
 *
 * <p>Campos *I18n recebem mapa BCP 47 → texto. Quando presente, sobrescreve o
 * campo String legado correspondente. Quando ausente, mantém valor atual.
 */
public record UpdateEventRequest(
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
        String locationAddress,
        String locationCity,
        Boolean locationIsOnline,
        String locationMapLink,
        String organizerName,
        String organizerContact,
        String priceLabel,
        Boolean isFeatured,
        List<String> schedule,
        List<String> specialGuests
) {
}
