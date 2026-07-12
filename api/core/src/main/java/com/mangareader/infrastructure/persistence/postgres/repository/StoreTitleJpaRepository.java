package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.store.entity.StoreTitle;

public interface StoreTitleJpaRepository extends JpaRepository<StoreTitle, UUID> {
    @Query("SELECT st FROM StoreTitle st JOIN FETCH st.store WHERE st.titleId = :titleId ORDER BY st.store.displayOrder, st.store.id")
    List<StoreTitle> findByTitleId(@Param("titleId") String titleId);

    @Modifying
    @Query("DELETE FROM StoreTitle st WHERE st.titleId = :titleId")
    void deleteByTitleId(@Param("titleId") String titleId);
}
