package com.toonlira.application.event.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.event.port.EventRepositoryPort;
import com.toonlira.shared.exception.ResourceNotFoundException;

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
