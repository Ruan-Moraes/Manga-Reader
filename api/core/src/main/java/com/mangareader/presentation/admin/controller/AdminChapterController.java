package com.mangareader.presentation.admin.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.Instant;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.usecase.admin.AdminChapterUseCase;
import com.mangareader.application.manga.usecase.admin.AdminChapterUseCase.CreateInput;
import com.mangareader.application.manga.usecase.admin.AdminChapterUseCase.UpdateInput;
import com.mangareader.application.manga.usecase.admin.AdminChapterUseCase.LegacyChapterInput;
import com.mangareader.application.manga.usecase.admin.AdminChapterUseCase.LegacyPageInput;
import com.mangareader.application.manga.usecase.admin.EnrichAdminChaptersUseCase;
import com.mangareader.domain.manga.valueobject.ChapterStatus;
import com.mangareader.presentation.admin.dto.AdminChapterRequest;
import com.mangareader.presentation.admin.dto.AdminChapterResponse;
import com.mangareader.presentation.admin.mapper.AdminChapterMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/chapters")
@RequiredArgsConstructor
public class AdminChapterController {
    private final AdminChapterUseCase useCase;
    private final EnrichAdminChaptersUseCase enrichment;
    private final AdminChapterMapper mapper;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminChapterResponse>>> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "number") String sort, @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search, @RequestParam(required = false) String titleId,
            @RequestParam(required = false) List<ChapterStatus> status,
            @RequestParam(required = false) Instant publishedFrom,
            @RequestParam(required = false) Instant publishedTo,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        String field = switch (sort) { case "publishedAt", "updatedAt", "displayOrder", "number" -> sort; default -> "number"; };
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        var result = useCase.list(titleId, status, search, publishedFrom, publishedTo, includeDeleted,
                PageRequest.of(page, Math.min(size, 1000), Sort.by(dir, field)));
        var content = enrichment.execute(result.getContent()).stream().map(mapper::toResponse).toList();
        var response = new org.springframework.data.domain.PageImpl<>(
                content, result.getPageable(), result.getTotalElements());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminChapterResponse>> get(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(toResponse(useCase.get(id))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminChapterResponse>> create(@Valid @RequestBody AdminChapterRequest.Create request, Authentication auth) {
        ChapterStatus status = request.status() == null ? ChapterStatus.DRAFT : ChapterStatus.valueOf(request.status());
        var input = new CreateInput(request.titleId(), Map.of("pt-BR", request.title()), request.number(), request.displayOrder(), request.description(), status, request.scheduledAt());
        return ResponseEntity.ok(ApiResponse.success(toResponse(useCase.create(input, (UUID) auth.getPrincipal()))));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminChapterResponse>> update(@PathVariable String id, @RequestBody AdminChapterRequest.Update request, Authentication auth) {
        Map<String, String> title = request.title() == null ? null : Map.of("pt-BR", request.title());
        var input = new UpdateInput(title, request.number(), request.displayOrder(), request.description(), request.scheduledAt(), request.version());
        return ResponseEntity.ok(ApiResponse.success(toResponse(useCase.update(id, input, (UUID) auth.getPrincipal()))));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminChapterResponse>> changeStatus(@PathVariable String id,
            @Valid @RequestBody AdminChapterRequest.ChangeStatus request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(toResponse(useCase.changeStatus(id,
                ChapterStatus.valueOf(request.status()), request.scheduledAt(), (UUID) auth.getPrincipal()))));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<AdminChapterResponse>> duplicate(@PathVariable String id,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(toResponse(
                useCase.duplicate(id, (UUID) auth.getPrincipal()))));
    }

    @PostMapping("/reorder")
    public ResponseEntity<Void> reorder(@Valid @RequestBody AdminChapterRequest.Reorder request,
            Authentication auth) {
        useCase.reorder(request.titleId(), request.orderedIds(), (UUID) auth.getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        useCase.softDelete(id, (UUID) auth.getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import-legacy")
    public ResponseEntity<ApiResponse<AdminChapterUseCase.LegacyImportResult>> importLegacy(
            @Valid @RequestBody AdminChapterRequest.LegacyImport request, Authentication auth) {
        var chapters = request.chapters().stream().map(chapter -> new LegacyChapterInput(
                chapter.legacyId(), chapter.titleId(), chapter.title(), chapter.number(),
                chapter.displayOrder(), chapter.description(),
                chapter.status(),
                chapter.scheduledAt(), chapter.publishedAt(), chapter.createdAt(), chapter.updatedAt(),
                chapter.pages() == null ? List.of() : chapter.pages().stream().map(page -> new LegacyPageInput(
                        page.id(), page.order(), page.originalFilename(), page.imageUrl(), page.thumbnailUrl(),
                        page.width(), page.height(), page.fileSize(), page.format(), page.processingStatus(),
                        page.createdAt(), page.updatedAt())).toList())).toList();
        return ResponseEntity.ok(ApiResponse.success(useCase.importLegacy(chapters, (UUID) auth.getPrincipal())));
    }

    private AdminChapterResponse toResponse(com.mangareader.domain.manga.entity.Chapter chapter) {
        return mapper.toResponse(enrichment.execute(List.of(chapter)).getFirst());
    }
}
