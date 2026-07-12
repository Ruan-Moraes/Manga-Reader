package com.mangareader.presentation.admin.controller;

import java.util.UUID;

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

import com.mangareader.application.store.usecase.CreateStoreUseCase;
import com.mangareader.application.store.usecase.DeleteStoreUseCase;
import com.mangareader.application.store.usecase.GetStoreByIdUseCase;
import com.mangareader.application.store.usecase.ListAdminStoresUseCase;
import com.mangareader.application.store.usecase.UpdateStoreUseCase;
import com.mangareader.domain.store.valueobject.StoreStatus;
import com.mangareader.presentation.admin.dto.AdminStoreResponse;
import com.mangareader.presentation.admin.dto.CreateStoreRequest;
import com.mangareader.presentation.admin.dto.UpdateStoreRequest;
import com.mangareader.presentation.admin.mapper.AdminStoreMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.PageParams;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/stores")
@RequiredArgsConstructor
public class AdminStoreController {
    private final ListAdminStoresUseCase listStores;
    private final GetStoreByIdUseCase getStore;
    private final CreateStoreUseCase createStore;
    private final UpdateStoreUseCase updateStore;
    private final DeleteStoreUseCase deleteStore;
    private final AdminStoreMapper mapper;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminStoreResponse>>> list(
            @RequestParam(required = false) String search, @RequestParam(required = false) StoreStatus status,
            // Consulta nativa: a ordenação precisa usar o nome físico da coluna.
            @PageParams(defaultSort = "display_order", defaultDirection = "asc", allow = {"display_order", "id"}) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(listStores.execute(search, status, pageable).map(mapper::toResponse))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminStoreResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(mapper.toResponse(getStore.execute(id))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminStoreResponse>> create(@Valid @RequestBody CreateStoreRequest request) {
        var store = createStore.execute(request.name(), request.website(), request.logo(), request.icon(), request.status(), request.displayOrder());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(mapper.toResponse(store)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminStoreResponse>> update(@PathVariable UUID id, @Valid @RequestBody UpdateStoreRequest request) {
        return ResponseEntity.ok(ApiResponse.success(mapper.toResponse(updateStore.execute(id, request.name(), request.website(), request.logo(), request.icon(), request.status(), request.displayOrder()))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        deleteStore.execute(id);
        return ResponseEntity.noContent().build();
    }
}
