package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Request admin para atualização de evento. Todos os campos opcionais.
 * Mapas multilíngues; quando nulos, mantém valor atual.
 */
public record UpdateEventRequest(
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
