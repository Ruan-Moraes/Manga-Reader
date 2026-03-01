package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.store.entity.Store;

/**
 * Spring Data JPA Repository para Stores.
 */
public interface StoreJpaRepository extends JpaRepository<Store, UUID> {
}
