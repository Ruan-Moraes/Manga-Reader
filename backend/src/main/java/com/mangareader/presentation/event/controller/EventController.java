package com.mangareader.presentation.event.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.event.usecase.GetEventByIdUseCase;
import com.mangareader.application.event.usecase.GetEventsByStatusUseCase;
import com.mangareader.application.event.usecase.GetEventsUseCase;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.presentation.event.dto.EventResponse;
import com.mangareader.presentation.event.mapper.EventMapper;
import com.mangareader.shared.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller de eventos — totalmente público.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Eventos da comunidade")
public class EventController {

    private final GetEventsUseCase getEventsUseCase;
    private final GetEventByIdUseCase getEventByIdUseCase;
    private final GetEventsByStatusUseCase getEventsByStatusUseCase;

    @GetMapping
    @Operation(summary = "Listar eventos", description = "Retorna todos os eventos ordenados por data de início")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAll() {
        var events = getEventsUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(EventMapper.toResponseList(events)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar evento por ID")
    public ResponseEntity<ApiResponse<EventResponse>> getById(@PathVariable UUID id) {
        var event = getEventByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(EventMapper.toResponse(event)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Filtrar eventos por status")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getByStatus(@PathVariable String status) {
        var eventStatus = parseStatus(status);
        var events = getEventsByStatusUseCase.execute(eventStatus);
        return ResponseEntity.ok(ApiResponse.success(EventMapper.toResponseList(events)));
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private EventStatus parseStatus(String value) {
        for (EventStatus s : EventStatus.values()) {
            if (s.getValue().equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Status de evento inválido: " + value);
    }
}
