package com.mangareader.presentation.event.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.entity.EventTicket;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.presentation.event.dto.EventResponse;
import com.mangareader.presentation.event.dto.EventTicketResponse;

/**
 * Mapper para converter entidades de Event em DTOs de resposta.
 */
public final class EventMapper {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private EventMapper() {}

    public static EventResponse toResponse(Event event) {
        if (event == null) return null;

        return new EventResponse(
                event.getId().toString(),
                event.getTitle(),
                event.getSubtitle(),
                event.getDescription(),
                event.getImage(),
                event.getGallery(),
                formatDateTime(event.getStartDate()),
                formatDateTime(event.getEndDate()),
                event.getTimezone(),
                event.getTimeline() != null ? event.getTimeline().name().toLowerCase() : null,
                event.getStatus() != null ? event.getStatus().getValue() : null,
                event.getType() != null ? event.getType().getDisplayName() : null,
                mapLocation(event.getLocation()),
                mapOrganizer(event.getOrganizer()),
                event.getPriceLabel(),
                event.getParticipants(),
                event.getInterested(),
                event.isFeatured(),
                event.getSchedule(),
                event.getSpecialGuests(),
                mapTickets(event.getTickets()),
                event.getSocialLinks(),
                event.getRelatedEventIds()
        );
    }

    public static List<EventResponse> toResponseList(List<Event> events) {
        if (events == null) return Collections.emptyList();

        return events.stream().map(EventMapper::toResponse).toList();
    }

    private static EventResponse.LocationResponse mapLocation(EventLocation loc) {
        if (loc == null) return null;

        return new EventResponse.LocationResponse(
                loc.getLabel(),
                loc.getAddress(),
                loc.getCity(),
                loc.isOnline(),
                loc.getMapLink(),
                loc.getDirections()
        );
    }

    private static EventResponse.OrganizerResponse mapOrganizer(EventOrganizer org) {
        if (org == null) return null;

        return new EventResponse.OrganizerResponse(
                org.getOrganizerId(),
                org.getOrganizerName(),
                org.getOrganizerAvatar(),
                org.getOrganizerProfileLink(),
                org.getOrganizerContact()
        );
    }

    private static List<EventTicketResponse> mapTickets(List<EventTicket> tickets) {
        if (tickets == null) return Collections.emptyList();

        return tickets.stream()
                .map(t -> new EventTicketResponse(
                        t.getId().toString(),
                        t.getName(),
                        t.getPrice(),
                        t.getAvailable()
                ))
                .toList();
    }

    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;

        return dateTime.format(FMT);
    }
}
