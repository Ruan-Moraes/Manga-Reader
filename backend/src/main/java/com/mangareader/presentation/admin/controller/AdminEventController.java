package com.mangareader.presentation.admin.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.application.event.usecase.admin.CreateEventUseCase;
import com.mangareader.application.event.usecase.admin.DeleteEventUseCase;
import com.mangareader.application.event.usecase.admin.UpdateEventUseCase;
import com.mangareader.domain.event.valueobject.EventLocation;
import com.mangareader.domain.event.valueobject.EventOrganizer;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.event.valueobject.EventTimeline;
import com.mangareader.domain.event.valueobject.EventType;
import com.mangareader.presentation.admin.dto.AdminEventResponse;
import com.mangareader.presentation.admin.dto.CreateEventRequest;
import com.mangareader.presentation.admin.dto.UpdateEventRequest;
import com.mangareader.presentation.admin.mapper.AdminEventMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.exception.ResourceNotFoundException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de eventos.
 */
@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final EventRepositoryPort eventRepository;
    private final CreateEventUseCase createEventUseCase;
    private final UpdateEventUseCase updateEventUseCase;
    private final DeleteEventUseCase deleteEventUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminEventResponse>>> listEvents(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "startDate") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        var result = (search != null && !search.isBlank())
                ? eventRepository.searchByTitle(search, pageable)
                : eventRepository.findAll(pageable);

        var mapped = result.map(AdminEventMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminEventResponse>> getEventDetail(@PathVariable UUID id) {
        var event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));

        return ResponseEntity.ok(ApiResponse.success(AdminEventMapper.toResponse(event)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminEventResponse>> createEvent(
            @Valid @RequestBody CreateEventRequest request
    ) {
        EventLocation location = EventLocation.builder()
                .label(request.locationLabel())
                .address(request.locationAddress())
                .city(request.locationCity())
                .isOnline(request.locationIsOnline())
                .mapLink(request.locationMapLink())
                .build();

        EventOrganizer organizer = EventOrganizer.builder()
                .organizerName(request.organizerName())
                .organizerContact(request.organizerContact())
                .build();

        var event = createEventUseCase.execute(
                request.title(), request.subtitle(), request.description(), request.image(),
                request.startDate(), request.endDate(), request.timezone(),
                EventTimeline.valueOf(request.timeline().toUpperCase()),
                EventStatus.valueOf(request.status().toUpperCase()),
                EventType.valueOf(request.type().toUpperCase()),
                location, organizer, request.priceLabel(), request.isFeatured(),
                request.schedule(), request.specialGuests()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(AdminEventMapper.toResponse(event)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminEventResponse>> updateEvent(
            @PathVariable UUID id,
            @RequestBody UpdateEventRequest request
    ) {
        EventLocation location = (request.locationLabel() != null || request.locationCity() != null
                || request.locationIsOnline() != null)
                ? EventLocation.builder()
                        .label(request.locationLabel())
                        .address(request.locationAddress())
                        .city(request.locationCity())
                        .isOnline(request.locationIsOnline() != null && request.locationIsOnline())
                        .mapLink(request.locationMapLink())
                        .build()
                : null;

        EventOrganizer organizer = request.organizerName() != null
                ? EventOrganizer.builder()
                        .organizerName(request.organizerName())
                        .organizerContact(request.organizerContact())
                        .build()
                : null;

        EventTimeline timeline = request.timeline() != null
                ? EventTimeline.valueOf(request.timeline().toUpperCase())
                : null;

        EventStatus status = request.status() != null
                ? EventStatus.valueOf(request.status().toUpperCase())
                : null;

        EventType type = request.type() != null
                ? EventType.valueOf(request.type().toUpperCase())
                : null;

        var event = updateEventUseCase.execute(
                id, request.title(), request.subtitle(), request.description(), request.image(),
                request.startDate(), request.endDate(), request.timezone(),
                timeline, status, type, location, organizer,
                request.priceLabel(), request.isFeatured(),
                request.schedule(), request.specialGuests()
        );

        return ResponseEntity.ok(ApiResponse.success(AdminEventMapper.toResponse(event)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        deleteEventUseCase.execute(id);
        return ResponseEntity.noContent().build();
    }
}
