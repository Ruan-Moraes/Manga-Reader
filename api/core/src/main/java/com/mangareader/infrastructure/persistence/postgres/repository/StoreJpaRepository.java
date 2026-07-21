package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreStatus;

/**
 * Spring Data JPA Repository para Stores.
 */
public interface StoreJpaRepository extends JpaRepository<Store, UUID> {
    @Query(value = """
            SELECT * FROM stores s
            WHERE (CAST(:status AS varchar) IS NULL OR s.status = CAST(:status AS varchar))
              AND (CAST(:search AS text) IS NULL OR CAST(s.name AS text) ILIKE CONCAT('%', CAST(:search AS text), '%'))
            """, countQuery = """
            SELECT COUNT(*) FROM stores s
            WHERE (CAST(:status AS varchar) IS NULL OR s.status = CAST(:status AS varchar))
              AND (CAST(:search AS text) IS NULL OR CAST(s.name AS text) ILIKE CONCAT('%', CAST(:search AS text), '%'))
            """, nativeQuery = true)
    Page<Store> search(@Param("search") String search, @Param("status") StoreStatus status, Pageable pageable);

    Page<Store> findByStatus(StoreStatus status, Pageable pageable);
    @Query("SELECT DISTINCT s FROM Store s JOIN s.titles t WHERE t.titleId = :titleId AND s.status = 'ACTIVE'")
    List<Store> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT DISTINCT s FROM Store s JOIN s.titles t WHERE t.titleId = :titleId AND s.status = 'ACTIVE'")
    Page<Store> findByTitleId(@Param("titleId") String titleId, Pageable pageable);

    /** Remove o título de todas as lojas (limpeza de órfão cross-DB). */
    @Modifying
    @Query("DELETE FROM StoreTitle t WHERE t.titleId = :titleId")
    int deleteTitlesByTitleId(@Param("titleId") String titleId);
}
