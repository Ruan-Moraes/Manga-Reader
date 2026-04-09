package com.mangareader.application.event.usecase.admin;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo evento (admin).
 */
@Service
@RequiredArgsConstructor
public class CreateEventUseCase {

    private final EventRepositoryPort eventRepository;

    @Transactional
    public Event execute(String title, String subtitle, String description, String image,
                         LocalDateTime startDate, LocalDateTime endDate, String timezone,
                         EventTimeline timeline, EventStatus status, EventType type,
                         EventLocation location, EventOrganizer organizer,
                         String priceLabel, boolean isFeatured,
                         List<String> schedule, List<String> specialGuests) {
        Event event = Event.builder()
                .title(title)
                .subtitle(subtitle)
                .description(description)
                .image(image)
                .startDate(startDate)
                .endDate(endDate)
                .timezone(timezone)
                .timeline(timeline)
                .status(status)
                .type(type)
                .location(location)
                .organizer(organizer)
                .priceLabel(priceLabel)
                .isFeatured(isFeatured)
                .schedule(schedule != null ? schedule : List.of())
                .specialGuests(specialGuests != null ? specialGuests : List.of())
                .build();

        return eventRepository.save(event);
    }
}
