package com.mangareader.application.store.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.mangareader.domain.store.entity.Store;

/**
 * Port de saída — acesso a dados de Stores (PostgreSQL).
 */
public interface StoreRepositoryPort {

    List<Store> findAll();

    Optional<Store> findById(UUID id);

    Store save(Store store);

    void deleteById(UUID id);
}
