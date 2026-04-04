package com.mangareader.application.event.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public Event execute(UUID id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));

        event.getTickets().size();

        return event;
    }
}
