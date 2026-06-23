package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;

/**
 * Spring Data JPA repository para a biblioteca do usuário.
 */
public interface LibraryJpaRepository extends JpaRepository<SavedManga, UUID> {
    List<SavedManga> findByUserId(UUID userId);

    List<SavedManga> findByUserIdAndList(UUID userId, ReadingListType list);

    Optional<SavedManga> findByUserIdAndTitleId(UUID userId, String titleId);

    void deleteByUserIdAndTitleId(UUID userId, String titleId);

    /** Remove o título da biblioteca de todos os usuários (limpeza de órfão cross-DB). */
    @Modifying
    @Query("DELETE FROM SavedManga s WHERE s.titleId = :titleId")
    int deleteByTitleId(@Param("titleId") String titleId);

    Page<SavedManga> findByUserId(UUID userId, Pageable pageable);

    Page<SavedManga> findByUserIdAndList(UUID userId, ReadingListType list, Pageable pageable);

    long countByUserIdAndList(UUID userId, ReadingListType list);
}
