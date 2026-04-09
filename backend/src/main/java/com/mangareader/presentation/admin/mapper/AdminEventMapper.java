package com.mangareader.presentation.admin.mapper;

import com.mangareader.domain.event.entity.Event;
import com.mangareader.presentation.admin.dto.AdminEventResponse;

/**
 * Mapper estático Event → AdminEventResponse.
 */
public final class AdminEventMapper {

    private AdminEventMapper() {
    }

    public static AdminEventResponse toResponse(Event event) {
        return new AdminEventResponse(
                event.getId(),
                event.getTitle(),
                event.getSubtitle(),
                event.getDescription(),
                event.getImage(),
                event.getStartDate(),
                event.getEndDate(),
                event.getTimezone(),
                event.getTimeline() != null ? event.getTimeline().name() : null,
                event.getStatus() != null ? event.getStatus().name() : null,
                event.getType() != null ? event.getType().name() : null,
                event.getLocation() != null ? event.getLocation().getLabel() : null,
                event.getLocation() != null ? event.getLocation().getCity() : null,
                event.getLocation() != null && event.getLocation().isOnline(),
                event.getOrganizer() != null ? event.getOrganizer().getOrganizerName() : null,
                event.getPriceLabel(),
                event.getParticipants(),
                event.getInterested(),
                event.isFeatured(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
