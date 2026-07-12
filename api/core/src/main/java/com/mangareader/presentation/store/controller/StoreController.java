package com.mangareader.presentation.store.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.store.usecase.GetStoreByIdUseCase;
import com.mangareader.application.store.usecase.GetStoresByTitleIdUseCase;
import com.mangareader.application.store.usecase.GetStoresUseCase;
import com.mangareader.presentation.store.dto.StoreResponse;
import com.mangareader.presentation.store.mapper.StoreMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.PageParams;

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
    private final StoreMapper storeMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StoreResponse>>> getAll(
            @PageParams(defaultSort = "id", defaultDirection = "asc",
                    allow = {"id", "rating"})
            Pageable pageable
    ) {
        var result = getStoresUseCase.execute(pageable);

        var mapped = result.map(storeMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StoreResponse>> getById(@PathVariable UUID id) {
        var store = getStoreByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(storeMapper.toResponse(store)));
    }

    @GetMapping("/title/{titleId}")
    public ResponseEntity<ApiResponse<PageResponse<StoreResponse>>> getByTitleId(
            @PathVariable String titleId,
            @PageParams(defaultSort = "id", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = getStoresByTitleIdUseCase.execute(titleId, pageable);

        var mapped = result.map(store -> storeMapper.toResponse(store, titleId));

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }
}
