package com.mangareader.infrastructure.persistence.mongo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.user.entity.ActivityEvent;

/**
 * Spring Data MongoDB repository para o feed de atividades.
 */
public interface ActivityEventMongoRepository extends MongoRepository<ActivityEvent, String> {
    Page<ActivityEvent> findByUserIdAndHiddenFalseOrderByOccurredAtDesc(String userId, Pageable pageable);
}
