package com.toonlira.infrastructure.persistence.postgres.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.toonlira.domain.publisher.entity.TitlePublisher;

/**
 * Spring Data JPA repository para a junção título ↔ editora.
 */
public interface TitlePublisherJpaRepository extends JpaRepository<TitlePublisher, Long> {
    interface SearchReferenceProjection {
        String getTitleId();
        String getMatchedText();
    }

    @Query("SELECT tp FROM TitlePublisher tp JOIN FETCH tp.publisher WHERE tp.titleId = :titleId")
    List<TitlePublisher> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT tp FROM TitlePublisher tp JOIN FETCH tp.publisher WHERE tp.titleId IN :titleIds")
    List<TitlePublisher> findByTitleIdIn(@Param("titleIds") java.util.Collection<String> titleIds);

    @Query("SELECT tp.titleId FROM TitlePublisher tp WHERE tp.publisher.id = :publisherId")
    List<String> findTitleIdsByPublisherId(@Param("publisherId") Long publisherId);

    @Query("SELECT tp FROM TitlePublisher tp JOIN FETCH tp.publisher WHERE tp.publisher.id IN :publisherIds")
    List<TitlePublisher> findByPublisherIdIn(@Param("publisherIds") java.util.Collection<Long> publisherIds);

    @Query(value = """
            SELECT DISTINCT tp.title_id AS titleId,
                   COALESCE(
                       CASE
                           WHEN mr_normalize_search(p.name) LIKE CONCAT('%', :query, '%') THEN p.name
                       END,
                       (
                           SELECT pa.name
                           FROM publisher_aliases pa
                           WHERE pa.publisher_id = p.id
                             AND mr_normalize_search(pa.name) LIKE CONCAT('%', :query, '%')
                           ORDER BY pa.id
                           LIMIT 1
                       )
                   ) AS matchedText
            FROM title_publishers tp
            JOIN publishers p ON p.id = tp.publisher_id
            WHERE mr_normalize_search(p.name) LIKE CONCAT('%', :query, '%')
               OR EXISTS (
                   SELECT 1
                   FROM publisher_aliases pa
                   WHERE pa.publisher_id = p.id
                     AND mr_normalize_search(pa.name) LIKE CONCAT('%', :query, '%')
               )
            ORDER BY tp.title_id
            """, nativeQuery = true)
    List<SearchReferenceProjection> searchTitleReferences(@Param("query") String query);

    boolean existsByTitleIdAndPublisherId(String titleId, Long publisherId);

    /** Ver TitleAuthorJpaRepository#deleteByTitleId(String). */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TitlePublisher tp WHERE tp.titleId = :titleId")
    void deleteByTitleId(@Param("titleId") String titleId);
}
