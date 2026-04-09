package com.mangareader.application.event.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui um evento (admin).
 */
@Service
@RequiredArgsConstructor
public class DeleteEventUseCase {

    private final EventRepositoryPort eventRepository;

    @Transactional
    public void execute(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        eventRepository.deleteById(eventId);
    }
}
