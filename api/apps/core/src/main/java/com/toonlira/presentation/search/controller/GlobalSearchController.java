package com.toonlira.presentation.search.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.toonlira.application.search.GlobalSearchUseCase;
import com.toonlira.domain.search.valueobject.GlobalSearchEntityType;
import com.toonlira.presentation.search.dto.GlobalSearchResultResponse;
import com.toonlira.presentation.search.dto.GlobalSearchSuggestionsResponse;
import com.toonlira.presentation.search.mapper.GlobalSearchMapper;
import com.toonlira.shared.dto.ApiResponse;
import com.toonlira.shared.dto.PageResponse;
import com.toonlira.shared.web.CurrentUserId;
import com.toonlira.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Validated
@Tag(name = "Global Search", description = "Busca multicategoria do catálogo")
public class GlobalSearchController {
    private final GlobalSearchUseCase globalSearchUseCase;

    @GetMapping("/suggestions")
    @Operation(summary = "Sugestões globais agrupadas por categoria")
    public ResponseEntity<ApiResponse<GlobalSearchSuggestionsResponse>> suggestions(
            @RequestParam
            @NotBlank(message = "{validation.title.search.required}")
            @Size(min = 2, max = 100, message = "{validation.title.search.length}")
            String q,
            @RequestParam(defaultValue = "2")
            @Min(1) @Max(12)
            int limitPerType,
            @CurrentUserId UUID userId) {
        var result = globalSearchUseCase.suggestions(q, limitPerType, userId);
        return ResponseEntity.ok(ApiResponse.success(GlobalSearchMapper.toResponse(result)));
    }

    @GetMapping
    @Operation(summary = "Busca global paginada por categoria")
    public ResponseEntity<ApiResponse<PageResponse<GlobalSearchResultResponse>>> search(
            @RequestParam
            @NotBlank(message = "{validation.title.search.required}")
            @Size(min = 2, max = 100, message = "{validation.title.search.length}")
            String q,
            @RequestParam GlobalSearchEntityType type,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable,
            @CurrentUserId UUID userId) {
        var result = globalSearchUseCase.search(q, type, pageable, userId)
                .map(GlobalSearchMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }
}
