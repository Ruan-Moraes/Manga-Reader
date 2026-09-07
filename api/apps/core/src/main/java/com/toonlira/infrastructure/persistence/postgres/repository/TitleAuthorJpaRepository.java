package com.toonlira.infrastructure.persistence.postgres.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.toonlira.domain.author.entity.TitleAuthor;
import com.toonlira.domain.author.valueobject.AuthorRole;

/**
 * Spring Data JPA repository para a junção título ↔ autor.
 */
public interface TitleAuthorJpaRepository extends JpaRepository<TitleAuthor, Long> {
    interface SearchReferenceProjection {
        String getTitleId();
        String getMatchedText();
        String getRole();
    }

    @Query("SELECT ta FROM TitleAuthor ta JOIN FETCH ta.author WHERE ta.titleId = :titleId")
    List<TitleAuthor> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT ta FROM TitleAuthor ta JOIN FETCH ta.author WHERE ta.titleId IN :titleIds")
    List<TitleAuthor> findByTitleIdIn(@Param("titleIds") java.util.Collection<String> titleIds);

    @Query("SELECT ta.titleId FROM TitleAuthor ta WHERE ta.author.id = :authorId")
    List<String> findTitleIdsByAuthorId(@Param("authorId") Long authorId);

    @Query("SELECT ta FROM TitleAuthor ta JOIN FETCH ta.author WHERE ta.author.id IN :authorIds")
    List<TitleAuthor> findByAuthorIdIn(@Param("authorIds") java.util.Collection<Long> authorIds);

    @Query(value = """
            SELECT DISTINCT ta.title_id AS titleId,
                   COALESCE(
                       CASE
                           WHEN mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%') THEN a.name
                       END,
                       (
                           SELECT aa.name
                           FROM author_aliases aa
                           WHERE aa.author_id = a.id
                             AND mr_normalize_search(aa.name) LIKE CONCAT('%', :query, '%')
                           ORDER BY aa.id
                           LIMIT 1
                       )
                   ) AS matchedText,
                   ta.role AS role
            FROM title_authors ta
            JOIN authors a ON a.id = ta.author_id
            WHERE (
                    mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%')
                 OR EXISTS (
                     SELECT 1
                     FROM author_aliases aa
                     WHERE aa.author_id = a.id
                       AND mr_normalize_search(aa.name) LIKE CONCAT('%', :query, '%')
                 )
            )
              AND ta.role IN ('AUTHOR', 'ARTIST', 'STORY', 'COLORIST', 'LETTERER')
            ORDER BY ta.title_id, ta.role
            """, nativeQuery = true)
    List<SearchReferenceProjection> searchTitleReferences(@Param("query") String query);

    boolean existsByTitleIdAndAuthorIdAndRole(String titleId, Long authorId, AuthorRole role);

    /**
     * Delete em lote para que a remoção seja executada antes das novas inserções
     * da mesma substituição. O delete derivado agenda remoções no persistence
     * context, e o Hibernate pode tentar os INSERTs antes delas no flush.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TitleAuthor ta WHERE ta.titleId = :titleId")
    void deleteByTitleId(@Param("titleId") String titleId);
}
