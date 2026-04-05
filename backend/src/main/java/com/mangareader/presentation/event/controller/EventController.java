package com.mangareader.presentation.event.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import com.mangareader.shared.dto.PageResponse;

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
    @Operation(summary = "Listar eventos", description = "Retorna eventos com paginação")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "startDate") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);

        var result = getEventsUseCase.execute(pageable);

        var mapped = result.map(EventMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar evento por ID")
    public ResponseEntity<ApiResponse<EventResponse>> getById(@PathVariable UUID id) {
        var event = getEventByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(EventMapper.toResponse(event)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Filtrar eventos por status")
    public ResponseEntity<ApiResponse<PageResponse<EventResponse>>> getByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var eventStatus = parseStatus(status);

        var pageable = buildPageable(page, size, "startDate", "desc");

        var result = getEventsByStatusUseCase.execute(eventStatus, pageable);

        var mapped = result.map(EventMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    // TODO: Retirar essa lógica do controller
    private EventStatus parseStatus(String value) {
        for (EventStatus s : EventStatus.values()) {
            if (s.getValue().equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) {
                return s;
            }
        }

        throw new IllegalArgumentException("Status de evento inválido: " + value);
    }

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
