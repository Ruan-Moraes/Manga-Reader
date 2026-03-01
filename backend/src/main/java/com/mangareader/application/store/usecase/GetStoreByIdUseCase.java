package com.mangareader.application.store.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca uma loja pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetStoreByIdUseCase {

    private final StoreRepositoryPort storeRepository;

    public Store execute(UUID id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id.toString()));
    }
}
