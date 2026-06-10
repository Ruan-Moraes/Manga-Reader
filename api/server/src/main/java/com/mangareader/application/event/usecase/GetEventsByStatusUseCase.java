package com.mangareader.application.event.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.domain.event.entity.Event;
import com.mangareader.domain.event.valueobject.EventStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetEventsByStatusUseCase {
    private final EventRepositoryPort eventRepository;

    @Transactional(readOnly = true)
    public Page<Event> execute(EventStatus status, Pageable pageable) {
        return eventRepository.findByStatus(status, pageable);
    }
}
