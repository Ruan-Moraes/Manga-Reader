package com.mangareader.infrastructure.persistence.postgres.adapter;

import org.springframework.stereotype.Component;

import com.mangareader.application.event.port.EventOrganizerRepositoryPort;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.infrastructure.persistence.postgres.repository.EventOrganizerJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link EventOrganizerRepositoryPort} via Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class EventOrganizerRepositoryAdapter implements EventOrganizerRepositoryPort {
    private final EventOrganizerJpaRepository repository;

    @Override
    public EventOrganizer findOrCreate(EventOrganizer organizer) {
        if (organizer == null) {
            return null;
        }

        if (organizer.getOrganizerId() == null) {
            return repository.save(organizer);
        }

        return repository.findByOrganizerId(organizer.getOrganizerId())
                .map(existing -> {
                    existing.setOrganizerName(organizer.getOrganizerName());
                    existing.setOrganizerAvatar(organizer.getOrganizerAvatar());
                    existing.setOrganizerProfileLink(organizer.getOrganizerProfileLink());
                    existing.setOrganizerContact(organizer.getOrganizerContact());
                    return repository.save(existing);
                })
                .orElseGet(() -> repository.save(organizer));
    }
}
