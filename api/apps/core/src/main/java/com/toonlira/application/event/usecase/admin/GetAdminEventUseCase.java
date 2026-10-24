package com.toonlira.application.event.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.event.port.EventRepositoryPort;
import com.toonlira.domain.event.entity.Event;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca administrativa de um evento por ID (entidade crua, sem resolução de
 * locale — o mapper admin expõe todos os idiomas).
 */
@Service
@RequiredArgsConstructor
public class GetAdminEventUseCase {
    private final EventRepositoryPort eventRepository;

    @Transactional(readOnly = true)
    public Event execute(UUID id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
    }
}
