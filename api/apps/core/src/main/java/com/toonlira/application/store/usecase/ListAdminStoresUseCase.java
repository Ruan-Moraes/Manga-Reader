package com.toonlira.application.store.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.store.port.StoreRepositoryPort;
import com.toonlira.domain.store.entity.Store;
import com.toonlira.domain.store.valueobject.StoreStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListAdminStoresUseCase {
    private final StoreRepositoryPort storeRepository;

    public Page<Store> execute(String search, StoreStatus status, Pageable pageable) {
        return storeRepository.search(search == null || search.isBlank() ? null : search.trim(), status, pageable);
    }
}
