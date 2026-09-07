package com.toonlira.application.event.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.event.port.EventRepositoryPort;
import com.toonlira.domain.event.entity.Event;
import com.toonlira.domain.event.valueobject.EventStatus;

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
