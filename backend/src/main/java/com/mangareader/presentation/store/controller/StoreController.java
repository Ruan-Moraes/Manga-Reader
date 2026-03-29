package com.mangareader.presentation.store.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.store.usecase.GetStoreByIdUseCase;
import com.mangareader.application.store.usecase.GetStoresByTitleIdUseCase;
import com.mangareader.application.store.usecase.GetStoresUseCase;
import com.mangareader.presentation.store.dto.StoreResponse;
import com.mangareader.presentation.store.mapper.StoreMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST para Lojas parceiras.
 */
@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {
    private final GetStoresUseCase getStoresUseCase;
    private final GetStoreByIdUseCase getStoreByIdUseCase;
    private final GetStoresByTitleIdUseCase getStoresByTitleIdUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StoreResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);

        var result = getStoresUseCase.execute(pageable);

        var mapped = result.map(StoreMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StoreResponse>> getById(@PathVariable UUID id) {
        var store = getStoreByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(StoreMapper.toResponse(store)));
    }

    @GetMapping("/title/{titleId}")
    public ResponseEntity<ApiResponse<PageResponse<StoreResponse>>> getByTitleId(
            @PathVariable String titleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));

        var result = getStoresByTitleIdUseCase.execute(titleId, pageable);

        var mapped = result.map(StoreMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
