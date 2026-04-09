package com.mangareader.application.event.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;

/**
 * Port de saída — acesso a dados de Events (PostgreSQL).
 */
public interface EventRepositoryPort {

    List<Event> findAll();

    Optional<Event> findById(UUID id);

    List<Event> findByStatus(EventStatus status);

    Event save(Event event);

    void deleteById(UUID id);

    Page<Event> findAll(Pageable pageable);

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    long count();
}
