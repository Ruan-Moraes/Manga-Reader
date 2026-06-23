package com.mangareader.presentation.event.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de evento para LISTAGEM — sem o array de tickets.
 * <p>
 * Tickets só são necessários no detalhe ({@link EventResponse}); incluí-los
 * na listagem forçava N+1 (lazy {@code @OneToMany} por evento) sem uso no
 * frontend. Reaproveita os tipos aninhados de {@link EventResponse}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventSummaryResponse(
        String id,
        String title,
        String subtitle,
        String description,
        String image,
        List<String> gallery,
        String startDate,
        String endDate,
        String timezone,
        String timeline,
        String status,
        String type,
        EventResponse.LocationResponse location,
        EventResponse.OrganizerResponse organizer,
        String priceLabel,
        int participants,
        int interested,
        boolean isFeatured,
        List<String> schedule,
        List<String> specialGuests,
        Object socialLinks,
        List<String> relatedEventIds
) {}
