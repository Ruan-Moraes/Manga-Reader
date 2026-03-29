package com.mangareader.application.store.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;

import lombok.RequiredArgsConstructor;

/**
 * Busca lojas que disponibilizam um determinado título de mangá.
 */
@Service
@RequiredArgsConstructor
public class GetStoresByTitleIdUseCase {

    private final StoreRepositoryPort storeRepository;

    public Page<Store> execute(String titleId, Pageable pageable) {
        return storeRepository.findByTitleId(titleId, pageable);
    }
}
