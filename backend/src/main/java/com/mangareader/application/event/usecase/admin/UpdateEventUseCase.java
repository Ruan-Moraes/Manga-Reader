package com.mangareader.application.event.usecase.admin;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um evento existente (admin).
 */
@Service
@RequiredArgsConstructor
public class UpdateEventUseCase {

    private final EventRepositoryPort eventRepository;

    @Transactional
    public Event execute(UUID eventId, String title, String subtitle, String description,
                         String image, LocalDateTime startDate, LocalDateTime endDate,
                         String timezone, EventTimeline timeline, EventStatus status,
                         EventType type, EventLocation location, EventOrganizer organizer,
                         String priceLabel, Boolean isFeatured,
                         List<String> schedule, List<String> specialGuests) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (title != null) event.setTitle(title);
        if (subtitle != null) event.setSubtitle(subtitle);
        if (description != null) event.setDescription(description);
        if (image != null) event.setImage(image);
        if (startDate != null) event.setStartDate(startDate);
        if (endDate != null) event.setEndDate(endDate);
        if (timezone != null) event.setTimezone(timezone);
        if (timeline != null) event.setTimeline(timeline);
        if (status != null) event.setStatus(status);
        if (type != null) event.setType(type);
        if (location != null) event.setLocation(location);
        if (organizer != null) event.setOrganizer(organizer);
        if (priceLabel != null) event.setPriceLabel(priceLabel);
        if (isFeatured != null) event.setFeatured(isFeatured);
        if (schedule != null) event.setSchedule(schedule);
        if (specialGuests != null) event.setSpecialGuests(specialGuests);

        return eventRepository.save(event);
    }
}
