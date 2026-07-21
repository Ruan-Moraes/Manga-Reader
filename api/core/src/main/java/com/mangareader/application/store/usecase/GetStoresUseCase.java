package com.mangareader.application.store.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as lojas parceiras.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetStoresUseCase {
    private final StoreRepositoryPort storeRepository;

    public Page<Store> execute(Pageable pageable) {
        return storeRepository.findActive(pageable);
    }
}
