package com.mangareader.presentation.category.controller;

import java.util.List;

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
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAll() {
        var tags = getTagsUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(TagMapper.toResponseList(tags)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> getById(@PathVariable Long id) {
        var tag = getTagByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(TagMapper.toResponse(tag)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TagResponse>>> search(@RequestParam("q") String query) {
        var tags = searchTagsUseCase.execute(query);
        return ResponseEntity.ok(ApiResponse.success(TagMapper.toResponseList(tags)));
    }
}
