package com.mangareader.application.event.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca um evento pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetEventByIdUseCase {

    private final EventRepositoryPort eventRepository;

    public Event execute(UUID id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
    }
}
