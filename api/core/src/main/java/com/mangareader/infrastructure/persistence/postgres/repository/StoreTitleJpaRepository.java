package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.Collection;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.store.entity.StoreTitle;

public interface StoreTitleJpaRepository extends JpaRepository<StoreTitle, UUID> {
    @Query("SELECT st FROM StoreTitle st JOIN FETCH st.store WHERE st.titleId = :titleId ORDER BY st.store.displayOrder, st.store.id")
    List<StoreTitle> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT st FROM StoreTitle st JOIN FETCH st.store WHERE st.titleId IN :titleIds ORDER BY st.titleId, st.store.displayOrder, st.store.id")
    List<StoreTitle> findByTitleIdIn(@Param("titleIds") Collection<String> titleIds);

    @Query(value = "SELECT st FROM StoreTitle st JOIN FETCH st.store WHERE st.titleId = :titleId",
            countQuery = "SELECT COUNT(st) FROM StoreTitle st WHERE st.titleId = :titleId")
    Page<StoreTitle> findByTitleId(@Param("titleId") String titleId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM StoreTitle st WHERE st.titleId = :titleId")
    void deleteByTitleId(@Param("titleId") String titleId);
}
