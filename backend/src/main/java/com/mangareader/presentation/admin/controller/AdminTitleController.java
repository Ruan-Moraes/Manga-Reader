package com.mangareader.presentation.admin.controller;

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

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.usecase.admin.CreateTitleUseCase;
import com.mangareader.application.manga.usecase.admin.DeleteTitleUseCase;
import com.mangareader.application.manga.usecase.admin.UpdateTitleUseCase;
import com.mangareader.presentation.admin.dto.AdminTitleResponse;
import com.mangareader.presentation.admin.dto.CreateTitleRequest;
import com.mangareader.presentation.admin.dto.UpdateTitleRequest;
import com.mangareader.presentation.admin.mapper.AdminTitleMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de títulos.
 */
@RestController
@RequestMapping("/api/admin/titles")
@RequiredArgsConstructor
public class AdminTitleController {

    private final TitleRepositoryPort titleRepository;
    private final CreateTitleUseCase createTitleUseCase;
    private final UpdateTitleUseCase updateTitleUseCase;
    private final DeleteTitleUseCase deleteTitleUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminTitleResponse>>> listTitles(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        var result = (search != null && !search.isBlank())
                ? titleRepository.searchByName(search, pageable)
                : titleRepository.findAll(pageable);

        var mapped = result.map(AdminTitleMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTitleResponse>> getTitleDetail(@PathVariable String id) {
        var title = titleRepository.findById(id)
                .orElseThrow(() -> new com.mangareader.shared.exception.ResourceNotFoundException("Title", "id", id));

        return ResponseEntity.ok(ApiResponse.success(AdminTitleMapper.toResponse(title)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminTitleResponse>> createTitle(
            @Valid @RequestBody CreateTitleRequest request
    ) {
        var title = createTitleUseCase.execute(
                request.name(), request.type(), request.cover(), request.synopsis(),
                request.genres(), request.status(), request.author(),
                request.artist(), request.publisher(), request.adult()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(AdminTitleMapper.toResponse(title)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTitleResponse>> updateTitle(
            @PathVariable String id,
            @RequestBody UpdateTitleRequest request
    ) {
        var title = updateTitleUseCase.execute(
                id, request.name(), request.type(), request.cover(), request.synopsis(),
                request.genres(), request.status(), request.author(),
                request.artist(), request.publisher(), request.adult()
        );

        return ResponseEntity.ok(ApiResponse.success(AdminTitleMapper.toResponse(title)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTitle(@PathVariable String id) {
        deleteTitleUseCase.execute(id);
        return ResponseEntity.noContent().build();
    }
}
