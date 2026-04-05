package com.mangareader.application.event.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public Page<Event> execute(Pageable pageable) {
        Page<Event> page = eventRepository.findAll(pageable);

        page.getContent().forEach(event -> event.getTickets().size());

        return page;
    }
}
