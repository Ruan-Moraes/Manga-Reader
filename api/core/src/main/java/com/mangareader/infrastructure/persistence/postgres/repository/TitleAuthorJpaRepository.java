package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.author.valueobject.AuthorRole;

/**
 * Spring Data JPA repository para a junção título ↔ autor.
 */
public interface TitleAuthorJpaRepository extends JpaRepository<TitleAuthor, Long> {
    @Query("SELECT ta FROM TitleAuthor ta JOIN FETCH ta.author WHERE ta.titleId = :titleId")
    List<TitleAuthor> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT ta FROM TitleAuthor ta JOIN FETCH ta.author WHERE ta.titleId IN :titleIds")
    List<TitleAuthor> findByTitleIdIn(@Param("titleIds") java.util.Collection<String> titleIds);

    @Query("SELECT ta.titleId FROM TitleAuthor ta WHERE ta.author.id = :authorId")
    List<String> findTitleIdsByAuthorId(@Param("authorId") Long authorId);

    boolean existsByTitleIdAndAuthorIdAndRole(String titleId, Long authorId, AuthorRole role);

    void deleteByTitleId(String titleId);
}
