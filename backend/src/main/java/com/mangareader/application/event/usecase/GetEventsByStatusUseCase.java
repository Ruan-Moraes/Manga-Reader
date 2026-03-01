package com.mangareader.application.event.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;

import lombok.RequiredArgsConstructor;

/**
 * Filtra eventos por status.
 */
@Service
@RequiredArgsConstructor
public class GetEventsByStatusUseCase {

    private final EventRepositoryPort eventRepository;

    public List<Event> execute(EventStatus status) {
        return eventRepository.findByStatus(status);
    }
}
