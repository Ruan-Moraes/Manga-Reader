package com.mangareader.presentation.event.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO completo de evento retornado ao frontend.
 * <p>
 * Compatível com {@code EventData} em event.types.ts.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EventResponse(
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
        LocationResponse location,
        OrganizerResponse organizer,
        String priceLabel,
        int participants,
        int interested,
        boolean isFeatured,
        List<String> schedule,
        List<String> specialGuests,
        List<EventTicketResponse> tickets,
        Object socialLinks,
        List<String> relatedEventIds
) {
    public record LocationResponse(
            String label,
            String address,
            String city,
            boolean isOnline,
            String mapLink,
            String directions
    ) {}

    public record OrganizerResponse(
            String id,
            String name,
            String avatar,
            String profileLink,
            String contact
    ) {}
}
