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
        Page<Event> result = (search != null && !search.isBlank())
                ? eventRepository.searchByTitle(search, pageable)
                : eventRepository.findAll(pageable);

        // searchByTitle é native query (sem @EntityGraph): força o organizer LAZY dentro
        // da transação, pois o mapper admin o lê (getOrganizerName) fora dela.
        result.getContent().forEach(e -> {
            if (e.getOrganizer() != null) e.getOrganizer().getOrganizerName();
        });

        return result;
    }
}
