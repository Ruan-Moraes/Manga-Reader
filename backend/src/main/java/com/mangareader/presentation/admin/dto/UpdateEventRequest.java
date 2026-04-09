package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Request para atualização de evento (admin). Todos os campos são opcionais.
 */
public record UpdateEventRequest(
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
