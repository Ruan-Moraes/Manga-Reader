package com.toonlira.application.store.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.store.port.StoreRepositoryPort;
import com.toonlira.domain.store.entity.Store;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca uma loja pelo ID.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetStoreByIdUseCase {
    private final StoreRepositoryPort storeRepository;

    public Store execute(UUID id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id.toString()));
    }
}
