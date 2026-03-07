package com.mangareader.application.event.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os eventos ordenados por data de início.
 */
@Service
@RequiredArgsConstructor
public class GetEventsUseCase {

    private final EventRepositoryPort eventRepository;

    public Page<Event> execute(Pageable pageable) {
        return eventRepository.findAll(pageable);
    }
}
