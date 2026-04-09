package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;

/**
 * Repositório JPA para eventos.
 */
public interface EventJpaRepository extends JpaRepository<Event, UUID> {
    List<Event> findByStatus(EventStatus status);

    List<Event> findAllByOrderByStartDateDesc();

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    Page<Event> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
