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

import com.mangareader.domain.publisher.entity.Publisher;

/**
 * Spring Data JPA repository para editoras.
 */
public interface PublisherJpaRepository extends JpaRepository<Publisher, Long> {
    @Override
    @EntityGraph(attributePaths = "aliases")
    Optional<Publisher> findById(Long id);

    @EntityGraph(attributePaths = "aliases")
    Optional<Publisher> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Publisher> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Publisher p LEFT JOIN FETCH p.aliases WHERE p.id IN :ids")
    List<Publisher> findAllWithAliasesByIdIn(@Param("ids") Collection<Long> ids);

    @Query(value = """
            SELECT p.*
            FROM publishers p
            WHERE mr_normalize_search(p.name) LIKE CONCAT('%', :query, '%')
               OR EXISTS (
                   SELECT 1 FROM publisher_aliases pa
                   WHERE pa.publisher_id = p.id
                     AND mr_normalize_search(pa.name) LIKE CONCAT('%', :query, '%')
               )
            ORDER BY CASE
                WHEN mr_normalize_search(p.name) = :query THEN 0
                WHEN mr_normalize_search(p.name) LIKE CONCAT(:query, '%') THEN 1
                WHEN mr_normalize_search(p.name) LIKE CONCAT('%', :query, '%') THEN 2
                ELSE 3
            END,
            (SELECT COUNT(DISTINCT tp_count.title_id)
             FROM title_publishers tp_count
             WHERE tp_count.publisher_id = p.id) DESC,
            mr_normalize_search(p.name), p.id
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM publishers p
            WHERE mr_normalize_search(p.name) LIKE CONCAT('%', :query, '%')
               OR EXISTS (
                   SELECT 1 FROM publisher_aliases pa
                   WHERE pa.publisher_id = p.id
                     AND mr_normalize_search(pa.name) LIKE CONCAT('%', :query, '%')
               )
            """, nativeQuery = true)
    Page<Publisher> searchCatalog(@Param("query") String query, Pageable pageable);
}
