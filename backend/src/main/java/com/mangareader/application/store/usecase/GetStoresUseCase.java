package com.mangareader.application.store.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as lojas parceiras.
 */
@Service
@RequiredArgsConstructor
public class GetStoresUseCase {

    private final StoreRepositoryPort storeRepository;

    public List<Store> execute() {
        return storeRepository.findAll();
    }
}
