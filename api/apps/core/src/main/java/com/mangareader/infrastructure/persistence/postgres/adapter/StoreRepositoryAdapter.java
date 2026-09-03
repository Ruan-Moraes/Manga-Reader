package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreStatus;
import com.mangareader.infrastructure.persistence.postgres.repository.StoreJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port {@link StoreRepositoryPort} ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class StoreRepositoryAdapter implements StoreRepositoryPort {
    private final StoreJpaRepository jpaRepository;

    @Override
    public List<Store> findAll() {
        return jpaRepository.findAll();
    }

    @Override
    public Optional<Store> findById(UUID id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Store save(Store store) {
        return jpaRepository.save(store);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<Store> findByTitleId(String titleId) {
        return jpaRepository.findByTitleId(titleId);
    }

    @Override
    public Page<Store> findByTitleId(String titleId, Pageable pageable) {
        return jpaRepository.findByTitleId(titleId, pageable);
    }

    @Override
    public Page<Store> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable);
    }

    @Override
    public Page<Store> search(String search, StoreStatus status, Pageable pageable) {
        return jpaRepository.search(search, status, pageable);
    }

    @Override
    public Page<Store> findActive(Pageable pageable) {
        return jpaRepository.findByStatus(StoreStatus.ACTIVE, pageable);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        jpaRepository.deleteTitlesByTitleId(titleId);
    }
}
