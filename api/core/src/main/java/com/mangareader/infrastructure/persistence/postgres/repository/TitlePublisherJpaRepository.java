package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.publisher.entity.TitlePublisher;

/**
 * Spring Data JPA repository para a junção título ↔ editora.
 */
public interface TitlePublisherJpaRepository extends JpaRepository<TitlePublisher, Long> {
    @Query("SELECT tp FROM TitlePublisher tp JOIN FETCH tp.publisher WHERE tp.titleId = :titleId")
    List<TitlePublisher> findByTitleId(@Param("titleId") String titleId);

    @Query("SELECT tp FROM TitlePublisher tp JOIN FETCH tp.publisher WHERE tp.titleId IN :titleIds")
    List<TitlePublisher> findByTitleIdIn(@Param("titleIds") java.util.Collection<String> titleIds);

    boolean existsByTitleIdAndPublisherId(String titleId, Long publisherId);

    void deleteByTitleId(String titleId);
}
