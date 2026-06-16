package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.store.entity.Store;

/**
 * Spring Data JPA Repository para Stores.
 */
public interface StoreJpaRepository extends JpaRepository<Store, UUID> {
    @Query("SELECT DISTINCT s FROM Store s JOIN s.titles t WHERE t.titleId = :titleId")
    List<Store> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT DISTINCT s FROM Store s JOIN s.titles t WHERE t.titleId = :titleId")
    Page<Store> findByTitleId(@Param("titleId") String titleId, Pageable pageable);
}
