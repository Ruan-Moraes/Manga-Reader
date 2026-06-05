package com.mangareader.application.event.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;

import lombok.RequiredArgsConstructor;

/**
 * Listagem administrativa de eventos com busca opcional por título.
 */
@Service
@RequiredArgsConstructor
public class ListAdminEventsUseCase {
    private final EventRepositoryPort eventRepository;

    @Transactional(readOnly = true)
    public Page<Event> execute(String search, Pageable pageable) {
        return (search != null && !search.isBlank())
                ? eventRepository.searchByTitle(search, pageable)
                : eventRepository.findAll(pageable);
    }
}
