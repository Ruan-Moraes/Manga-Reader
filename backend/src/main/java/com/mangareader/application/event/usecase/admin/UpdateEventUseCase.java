package com.mangareader.application.event.usecase.admin;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um evento existente (admin). Aceita campos legados String e os
 * novos mapas *I18n; quando ambos presentes, *I18n prevalece para o campo i18n.
 */
@Service
@RequiredArgsConstructor
public class UpdateEventUseCase {
    private final EventRepositoryPort eventRepository;

    @Transactional
    public Event execute(UUID eventId, String title, String subtitle, String description,
                         Map<String, String> titleI18n,
                         Map<String, String> subtitleI18n,
                         Map<String, String> descriptionI18n,
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
        if (titleI18n != null) event.setTitleI18n(LocalizedString.of(titleI18n));
        if (subtitleI18n != null) event.setSubtitleI18n(LocalizedString.of(subtitleI18n));
        if (descriptionI18n != null) event.setDescriptionI18n(LocalizedString.of(descriptionI18n));
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
