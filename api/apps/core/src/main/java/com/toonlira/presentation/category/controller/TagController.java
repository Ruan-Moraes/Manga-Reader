package com.toonlira.presentation.category.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.toonlira.application.category.usecase.CreateTagUseCase;
import com.toonlira.application.category.usecase.DeleteTagUseCase;
import com.toonlira.application.category.usecase.GetTagByIdUseCase;
import com.toonlira.application.category.usecase.GetTagsUseCase;
import com.toonlira.application.category.usecase.SearchTagsUseCase;
import com.toonlira.application.category.usecase.UpdateTagUseCase;
import com.toonlira.presentation.category.dto.TagAdminResponse;
import com.toonlira.presentation.category.dto.TagRequest;
import com.toonlira.presentation.category.dto.TagResponse;
import com.toonlira.presentation.category.mapper.TagMapper;
import com.toonlira.shared.dto.ApiResponse;
import com.toonlira.shared.dto.PageResponse;
import com.toonlira.shared.web.PageParams;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST para Tags / gêneros.
 */
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final GetTagsUseCase getTagsUseCase;
    private final GetTagByIdUseCase getTagByIdUseCase;
    private final SearchTagsUseCase searchTagsUseCase;
    private final CreateTagUseCase createTagUseCase;
    private final UpdateTagUseCase updateTagUseCase;
    private final DeleteTagUseCase deleteTagUseCase;
    private final TagMapper tagMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TagResponse>>> getAll(
            @PageParams(defaultSort = "id", defaultDirection = "asc",
                    allow = "id")
            Pageable pageable
    ) {
        var result = getTagsUseCase.execute(pageable);
        var mapped = result.map(tagMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> getById(@PathVariable Long id) {
        var tag = getTagByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(tagMapper.toResponse(tag)));
    }

    /** Admin: lista com mapas i18n para edição multilíngue. */
    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<PageResponse<TagAdminResponse>>> getAllAdmin(
            @PageParams(defaultSort = "id", defaultDirection = "asc",
                    allow = "id")
            Pageable pageable
    ) {
        var result = getTagsUseCase.execute(pageable);
        var mapped = result.map(tagMapper::toAdminResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    /** Admin: detalhe com mapa i18n para edição. */
    @GetMapping("/admin/{id}")
    public ResponseEntity<ApiResponse<TagAdminResponse>> getByIdAdmin(@PathVariable Long id) {
        var tag = getTagByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(tagMapper.toAdminResponse(tag)));
    }

    /** Admin: busca paginada com mapas i18n. */
    @GetMapping("/admin/search")
    public ResponseEntity<ApiResponse<PageResponse<TagAdminResponse>>> searchAdmin(
            @RequestParam("q") String query,
            @PageParams(defaultSort = "id", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = searchTagsUseCase.execute(query, pageable);
        var mapped = result.map(tagMapper::toAdminResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<TagResponse>>> search(
            @RequestParam("q") String query,
            @PageParams(defaultSort = "id", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = searchTagsUseCase.execute(query, pageable);
        var mapped = result.map(tagMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> create(@Valid @RequestBody TagRequest request) {
        var tag = createTagUseCase.execute(request.label());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tagMapper.toResponse(tag)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request
    ) {
        var tag = updateTagUseCase.execute(id, request.label());
        return ResponseEntity.ok(ApiResponse.success(tagMapper.toResponse(tag)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deleteTagUseCase.execute(id);
        return ResponseEntity.noContent().build();
    }
}
