package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request para criação de evento (admin).
 */
public record CreateEventRequest(
        @NotBlank(message = "{validation.event.title.required}") String title,
        String subtitle,
        String description,
        String image,
        @NotNull(message = "{validation.event.startDate.required}") LocalDateTime startDate,
        @NotNull(message = "{validation.event.endDate.required}") LocalDateTime endDate,
        String timezone,
        @NotNull(message = "{validation.event.timeline.required}") String timeline,
        @NotNull(message = "{validation.status.required}") String status,
        @NotNull(message = "{validation.event.type.required}") String type,
        String locationLabel,
        String locationAddress,
        String locationCity,
        boolean locationIsOnline,
        String locationMapLink,
        String organizerName,
        String organizerContact,
        String priceLabel,
        boolean isFeatured,
        List<String> schedule,
        List<String> specialGuests
) {
}
