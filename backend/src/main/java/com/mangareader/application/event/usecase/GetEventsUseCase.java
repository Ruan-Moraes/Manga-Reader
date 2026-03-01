package com.mangareader.application.event.usecase;

import java.util.List;

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

    public List<Event> execute() {
        return eventRepository.findAll();
    }
}
