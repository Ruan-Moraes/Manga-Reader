package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.event.valueobject.EventOrganizer;

/**
 * Spring Data repository para {@link EventOrganizer} (tabela {@code event_organizers}).
 */
public interface EventOrganizerJpaRepository extends JpaRepository<EventOrganizer, UUID> {
    Optional<EventOrganizer> findByOrganizerId(String organizerId);
}
