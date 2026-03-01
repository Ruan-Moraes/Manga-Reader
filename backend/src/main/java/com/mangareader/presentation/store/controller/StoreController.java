package com.mangareader.presentation.store.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.store.usecase.GetStoreByIdUseCase;
import com.mangareader.application.store.usecase.GetStoresUseCase;
import com.mangareader.presentation.store.dto.StoreResponse;
import com.mangareader.presentation.store.mapper.StoreMapper;
import com.mangareader.shared.dto.ApiResponse;

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

    @GetMapping
    public ResponseEntity<ApiResponse<List<StoreResponse>>> getAll() {
        var stores = getStoresUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(StoreMapper.toResponseList(stores)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StoreResponse>> getById(@PathVariable UUID id) {
        var store = getStoreByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(StoreMapper.toResponse(store)));
    }
}
