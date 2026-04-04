package com.mangareader.presentation.category.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

import com.mangareader.application.category.usecase.CreateTagUseCase;
import com.mangareader.application.category.usecase.DeleteTagUseCase;
import com.mangareader.application.category.usecase.GetTagByIdUseCase;
import com.mangareader.application.category.usecase.GetTagsUseCase;
import com.mangareader.application.category.usecase.SearchTagsUseCase;
import com.mangareader.application.category.usecase.UpdateTagUseCase;
import com.mangareader.presentation.category.dto.TagRequest;
import com.mangareader.presentation.category.dto.TagResponse;
import com.mangareader.presentation.category.mapper.TagMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

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

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TagResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "label") String sort,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);
        var result = getTagsUseCase.execute(pageable);
        var mapped = result.map(TagMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> getById(@PathVariable Long id) {
        var tag = getTagByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(TagMapper.toResponse(tag)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<TagResponse>>> search(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = buildPageable(page, size, "label", "asc");
        var result = searchTagsUseCase.execute(query, pageable);
        var mapped = result.map(TagMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TagResponse>> create(@Valid @RequestBody TagRequest request) {
        var tag = createTagUseCase.execute(request.label());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(TagMapper.toResponse(tag)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request
    ) {
        var tag = updateTagUseCase.execute(id, request.label());
        return ResponseEntity.ok(ApiResponse.success(TagMapper.toResponse(tag)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deleteTagUseCase.execute(id);
        return ResponseEntity.noContent().build();
    }

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
