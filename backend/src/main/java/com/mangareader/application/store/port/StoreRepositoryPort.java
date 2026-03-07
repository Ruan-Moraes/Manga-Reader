package com.mangareader.application.store.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.store.entity.Store;

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

    Page<Store> findAll(Pageable pageable);
}
