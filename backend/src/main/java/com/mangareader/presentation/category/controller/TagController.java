package com.mangareader.presentation.category.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.category.usecase.GetTagByIdUseCase;
import com.mangareader.application.category.usecase.GetTagsUseCase;
import com.mangareader.application.category.usecase.SearchTagsUseCase;
import com.mangareader.presentation.category.dto.TagResponse;
import com.mangareader.presentation.category.mapper.TagMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

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

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
