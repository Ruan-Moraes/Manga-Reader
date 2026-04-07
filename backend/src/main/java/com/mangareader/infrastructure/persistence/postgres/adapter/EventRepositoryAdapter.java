package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.infrastructure.persistence.postgres.repository.EventJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link EventRepositoryPort} usando Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class EventRepositoryAdapter implements EventRepositoryPort {
    private final EventJpaRepository repository;

    @Override
    public List<Event> findAll() {
        return repository.findAllByOrderByStartDateDesc();
    }

    @Override
    public Optional<Event> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public List<Event> findByStatus(EventStatus status) {
        return repository.findByStatus(status);
    }

    @Override
    public Event save(Event event) {
        return repository.save(event);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    @Override
    public Page<Event> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Page<Event> findByStatus(EventStatus status, Pageable pageable) {
        return repository.findByStatus(status, pageable);
    }
}
