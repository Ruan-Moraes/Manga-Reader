package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.mangareader.shared.application.i18n.RequiredLanguages;

import jakarta.validation.constraints.NotNull;

/**
 * Request para criação de evento (admin). Campos textuais multilíngues
 * (mapa BCP 47 → texto). pt-BR obrigatório no title.
 */
public record CreateEventRequest(
        @NotNull(message = "{validation.event.title.required}") @RequiredLanguages Map<String, String> title,
        Map<String, String> subtitle,
        Map<String, String> description,
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
