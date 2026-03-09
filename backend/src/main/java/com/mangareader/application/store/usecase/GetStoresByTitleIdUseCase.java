package com.mangareader.application.store.usecase;

import java.util.List;

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

    public List<Store> execute(String titleId) {
        return storeRepository.findByTitleId(titleId);
    }
}
