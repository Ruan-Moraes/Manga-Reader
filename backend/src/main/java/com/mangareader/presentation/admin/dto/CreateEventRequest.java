package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request para criação de evento (admin).
 */
public record CreateEventRequest(
        @NotBlank(message = "Título é obrigatório") String title,
        String subtitle,
        String description,
        String image,
        @NotNull(message = "Data de início é obrigatória") LocalDateTime startDate,
        @NotNull(message = "Data de fim é obrigatória") LocalDateTime endDate,
        String timezone,
        @NotNull(message = "Timeline é obrigatória") String timeline,
        @NotNull(message = "Status é obrigatório") String status,
        @NotNull(message = "Tipo é obrigatório") String type,
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
