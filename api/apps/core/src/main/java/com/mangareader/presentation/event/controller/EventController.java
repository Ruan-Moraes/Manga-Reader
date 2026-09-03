package com.mangareader.presentation.event.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
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
import com.mangareader.presentation.event.dto.EventSummaryResponse;
import com.mangareader.presentation.event.mapper.EventMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.PageParams;

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
    private final EventMapper eventMapper;

    @GetMapping
    @Operation(summary = "Listar eventos", description = "Retorna eventos com paginação")
    public ResponseEntity<ApiResponse<PageResponse<EventSummaryResponse>>> getAll(
            @PageParams(defaultSort = "startDate", defaultDirection = "desc")
            Pageable pageable
    ) {
        var result = getEventsUseCase.execute(pageable);

        var mapped = result.map(eventMapper::toSummary);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar evento por ID")
    public ResponseEntity<ApiResponse<EventResponse>> getById(@PathVariable UUID id) {
        var event = getEventByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(eventMapper.toResponse(event)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Filtrar eventos por status")
    public ResponseEntity<ApiResponse<PageResponse<EventSummaryResponse>>> getByStatus(
            @PathVariable String status,
            @PageParams(defaultSort = "startDate", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var eventStatus = EventStatus.fromValue(status);

        var result = getEventsByStatusUseCase.execute(eventStatus, pageable);

        var mapped = result.map(eventMapper::toSummary);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }
}
