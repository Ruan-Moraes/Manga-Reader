package com.mangareader.application.store.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.store.port.StoreTitleRepositoryPort;
import com.mangareader.domain.store.entity.StoreTitle;

import lombok.RequiredArgsConstructor;

/**
 * Busca lojas que disponibilizam um determinado título de mangá.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetStoresByTitleIdUseCase {
    private final StoreTitleRepositoryPort storeTitleRepository;

    public Page<StoreTitle> execute(String titleId, Pageable pageable) {
        return storeTitleRepository.findByTitleId(titleId, pageable);
    }
}
