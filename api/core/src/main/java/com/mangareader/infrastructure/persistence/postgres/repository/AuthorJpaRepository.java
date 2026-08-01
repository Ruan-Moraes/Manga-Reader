package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.author.entity.Author;

/**
 * Spring Data JPA repository para autores.
 */
public interface AuthorJpaRepository extends JpaRepository<Author, Long> {
    @Override
    @EntityGraph(attributePaths = "aliases")
    Optional<Author> findById(Long id);

    @EntityGraph(attributePaths = "aliases")
    Optional<Author> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Author> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT DISTINCT a FROM Author a LEFT JOIN FETCH a.aliases WHERE a.id IN :ids")
    List<Author> findAllWithAliasesByIdIn(@Param("ids") Collection<Long> ids);

    @Query(value = """
            SELECT a.*
            FROM authors a
            WHERE (
                    mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%')
                 OR EXISTS (
                     SELECT 1 FROM author_aliases aa
                     WHERE aa.author_id = a.id
                       AND mr_normalize_search(aa.name) LIKE CONCAT('%', :query, '%')
                 )
            )
              AND EXISTS (
                  SELECT 1 FROM title_authors ta
                  WHERE ta.author_id = a.id AND ta.role IN ('AUTHOR', 'STORY')
              )
            ORDER BY CASE
                WHEN mr_normalize_search(a.name) = :query THEN 0
                WHEN mr_normalize_search(a.name) LIKE CONCAT(:query, '%') THEN 1
                WHEN mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%') THEN 2
                ELSE 3
            END,
            (SELECT COUNT(DISTINCT ta_count.title_id)
             FROM title_authors ta_count
             WHERE ta_count.author_id = a.id) DESC,
            mr_normalize_search(a.name), a.id
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM authors a
            WHERE (
                    mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%')
                 OR EXISTS (
                     SELECT 1 FROM author_aliases aa
                     WHERE aa.author_id = a.id
                       AND mr_normalize_search(aa.name) LIKE CONCAT('%', :query, '%')
                 )
            )
              AND EXISTS (
                  SELECT 1 FROM title_authors ta
                  WHERE ta.author_id = a.id AND ta.role IN ('AUTHOR', 'STORY')
              )
            """, nativeQuery = true)
    Page<Author> searchCatalogAuthors(@Param("query") String query, Pageable pageable);

    @Query(value = """
            SELECT a.*
            FROM authors a
            WHERE (
                    mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%')
                 OR EXISTS (
                     SELECT 1 FROM author_aliases aa
                     WHERE aa.author_id = a.id
                       AND mr_normalize_search(aa.name) LIKE CONCAT('%', :query, '%')
                 )
            )
              AND EXISTS (
                  SELECT 1 FROM title_authors ta
                  WHERE ta.author_id = a.id
                    AND ta.role IN ('ARTIST', 'COLORIST', 'LETTERER')
              )
              AND (
                  :excludeAuthors = false
                  OR NOT EXISTS (
                      SELECT 1 FROM title_authors ta
                      WHERE ta.author_id = a.id AND ta.role IN ('AUTHOR', 'STORY')
                  )
              )
            ORDER BY CASE
                WHEN mr_normalize_search(a.name) = :query THEN 0
                WHEN mr_normalize_search(a.name) LIKE CONCAT(:query, '%') THEN 1
                WHEN mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%') THEN 2
                ELSE 3
            END,
            (SELECT COUNT(DISTINCT ta_count.title_id)
             FROM title_authors ta_count
             WHERE ta_count.author_id = a.id) DESC,
            mr_normalize_search(a.name), a.id
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM authors a
            WHERE (
                    mr_normalize_search(a.name) LIKE CONCAT('%', :query, '%')
                 OR EXISTS (
                     SELECT 1 FROM author_aliases aa
                     WHERE aa.author_id = a.id
                       AND mr_normalize_search(aa.name) LIKE CONCAT('%', :query, '%')
                 )
            )
              AND EXISTS (
                  SELECT 1 FROM title_authors ta
                  WHERE ta.author_id = a.id
                    AND ta.role IN ('ARTIST', 'COLORIST', 'LETTERER')
              )
              AND (
                  :excludeAuthors = false
                  OR NOT EXISTS (
                      SELECT 1 FROM title_authors ta
                      WHERE ta.author_id = a.id AND ta.role IN ('AUTHOR', 'STORY')
                  )
              )
            """, nativeQuery = true)
    Page<Author> searchCatalogArtists(
            @Param("query") String query,
            @Param("excludeAuthors") boolean excludeAuthors,
            Pageable pageable);
}
