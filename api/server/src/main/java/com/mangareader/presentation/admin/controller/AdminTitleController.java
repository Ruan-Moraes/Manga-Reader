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

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.manga.usecase.admin.CreateTitleUseCase;
import com.mangareader.application.manga.usecase.admin.DeleteTitleUseCase;
import com.mangareader.application.manga.usecase.admin.GetAdminTitleUseCase;
import com.mangareader.application.manga.usecase.admin.ListAdminTitlesUseCase;
import com.mangareader.application.manga.usecase.admin.UpdateTitleUseCase;
import com.mangareader.domain.manga.entity.Title;
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
    private final ListAdminTitlesUseCase listAdminTitlesUseCase;
    private final GetAdminTitleUseCase getAdminTitleUseCase;
    private final CreateTitleUseCase createTitleUseCase;
    private final UpdateTitleUseCase updateTitleUseCase;
    private final DeleteTitleUseCase deleteTitleUseCase;
    private final ChapterRepositoryPort chapterRepository;
    private final TitleRatingAggregateReadPort ratingAggregateReadPort;

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

        var result = listAdminTitlesUseCase.execute(search, pageable);

        var ids = result.getContent().stream().map(Title::getId).toList();
        var counts = chapterRepository.countByTitleIdIn(ids);
        var ratings = ratingAggregateReadPort.findByTitleIdIn(ids);

        var mapped = result.map(t -> AdminTitleMapper.toResponse(
                t, counts.getOrDefault(t.getId(), 0L), ratings.get(t.getId())));

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTitleResponse>> getTitleDetail(@PathVariable String id) {
        var title = getAdminTitleUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(
                AdminTitleMapper.toResponse(title, chapterRepository.countByTitleId(id),
                        ratingAggregateReadPort.findByTitleId(id).orElse(null))));
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
                .body(ApiResponse.created(AdminTitleMapper.toResponse(title, 0L)));
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

        return ResponseEntity.ok(ApiResponse.success(
                AdminTitleMapper.toResponse(title, chapterRepository.countByTitleId(id),
                        ratingAggregateReadPort.findByTitleId(id).orElse(null))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTitle(@PathVariable String id) {
        deleteTitleUseCase.execute(id);

        return ResponseEntity.noContent().build();
    }
}
