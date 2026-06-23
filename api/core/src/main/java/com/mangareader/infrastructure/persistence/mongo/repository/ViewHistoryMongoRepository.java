package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.user.entity.ViewHistory;

/**
 * Spring Data MongoDB repository para histórico de visualização.
 */
public interface ViewHistoryMongoRepository extends MongoRepository<ViewHistory, String> {
    Page<ViewHistory> findByUserIdOrderByViewedAtDesc(String userId, Pageable pageable);

    Optional<ViewHistory> findByUserIdAndTitleId(String userId, String titleId);

    void deleteAllByUserId(String userId);
}
