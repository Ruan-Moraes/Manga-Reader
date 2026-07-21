package com.mangareader.application.store.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreStatus;

/**
 * Port de saída — acesso a dados de Stores (PostgreSQL).
 */
public interface StoreRepositoryPort {
    List<Store> findAll();

    Optional<Store> findById(UUID id);

    Store save(Store store);

    void deleteById(UUID id);

    /**
     * Busca lojas que vendem um determinado título.
     */
    List<Store> findByTitleId(String titleId);

    Page<Store> findByTitleId(String titleId, Pageable pageable);

    Page<Store> findAll(Pageable pageable);

    Page<Store> search(String search, StoreStatus status, Pageable pageable);

    Page<Store> findActive(Pageable pageable);

    /** Remove o título de todas as lojas (limpeza de órfão cross-DB). */
    void deleteByTitleId(String titleId);
}
