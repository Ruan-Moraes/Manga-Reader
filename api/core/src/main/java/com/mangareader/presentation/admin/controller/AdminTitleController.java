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

import java.util.List;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.manga.service.TitleAssociationReader;
import com.mangareader.application.manga.service.TitleStoreAssociationReader;
import com.mangareader.application.manga.usecase.admin.CreateTitleUseCase;
import com.mangareader.application.manga.usecase.admin.DeleteTitleUseCase;
import com.mangareader.application.manga.usecase.admin.GetAdminTitleUseCase;
import com.mangareader.application.manga.usecase.admin.ListAdminTitlesUseCase;
import com.mangareader.application.manga.usecase.admin.TitleAuthorAssignment;
import com.mangareader.application.manga.usecase.admin.UpdateTitleUseCase;
import com.mangareader.application.manga.usecase.admin.TitleStoreAssignment;
import com.mangareader.domain.author.valueobject.AuthorRole;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.presentation.admin.dto.AdminTitleResponse;
import com.mangareader.presentation.admin.dto.AuthorAssignmentRequest;
import com.mangareader.presentation.admin.dto.CreateTitleRequest;
import com.mangareader.presentation.admin.dto.UpdateTitleRequest;
import com.mangareader.presentation.admin.mapper.AdminTitleMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.exception.BusinessRuleException;

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
    private final TitleAssociationReader titleAssociationReader;
    private final TitleStoreAssociationReader titleStoreAssociationReader;
    private final AdminTitleMapper adminTitleMapper;

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
        var authorsByTitle = titleAssociationReader.authorsByTitle(ids);
        var publishersByTitle = titleAssociationReader.publishersByTitle(ids);
        var storesByTitle = titleStoreAssociationReader.byTitles(ids);

        var mapped = result.map(t -> adminTitleMapper.toResponse(
                t, counts.getOrDefault(t.getId(), 0L), ratings.get(t.getId()),
                authorsByTitle, publishersByTitle, storesByTitle));

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTitleResponse>> getTitleDetail(@PathVariable String id) {
        var title = getAdminTitleUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(toResponse(
                title, chapterRepository.countByTitleId(id),
                ratingAggregateReadPort.findByTitleId(id).orElse(null))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminTitleResponse>> createTitle(
            @Valid @RequestBody CreateTitleRequest request
    ) {
        var title = createTitleUseCase.execute(
                request.name(), request.type(), request.cover(), request.synopsis(),
                request.genres(), request.status(), request.author(),
                request.artist(), request.publisher(), request.adult(),
                toAssignments(request.authors()), request.publishers(), toStoreAssignments(request.stores())
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(toResponse(title, 0L, null)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminTitleResponse>> updateTitle(
            @PathVariable String id,
            @RequestBody UpdateTitleRequest request
    ) {
        var title = updateTitleUseCase.execute(
                id, request.name(), request.type(), request.cover(), request.synopsis(),
                request.genres(), request.status(), request.author(),
                request.artist(), request.publisher(), request.adult(),
                toAssignments(request.authors()), request.publishers(), toStoreAssignments(request.stores())
        );

        return ResponseEntity.ok(ApiResponse.success(toResponse(
                title, chapterRepository.countByTitleId(id),
                ratingAggregateReadPort.findByTitleId(id).orElse(null))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTitle(@PathVariable String id) {
        deleteTitleUseCase.execute(id);

        return ResponseEntity.noContent().build();
    }

    /** Converte os requests de atribuição em assignments do use case. Null preserva (PATCH). */
    private static List<TitleAuthorAssignment> toAssignments(List<AuthorAssignmentRequest> authors) {
        if (authors == null) return null;

        return authors.stream()
                .map(a -> new TitleAuthorAssignment(a.authorId(), parseRole(a.role())))
                .toList();
    }

    private static AuthorRole parseRole(String role) {
        if (role == null || role.isBlank()) return AuthorRole.AUTHOR;

        try {
            return AuthorRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("Papel de autor inválido: " + role, 400);
        }
    }

    private static List<TitleStoreAssignment> toStoreAssignments(List<com.mangareader.presentation.admin.dto.StoreAssignmentRequest> stores) {
        if (stores == null) return null;
        return stores.stream().map(store -> new TitleStoreAssignment(store.storeId(), store.url())).toList();
    }

    private AdminTitleResponse toResponse(Title title, long chaptersCount,
            com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView rating) {
        var ids = List.of(title.getId());
        return adminTitleMapper.toResponse(title, chaptersCount, rating,
                titleAssociationReader.authorsByTitle(ids),
                titleAssociationReader.publishersByTitle(ids),
                titleStoreAssociationReader.byTitles(ids));
    }
}
