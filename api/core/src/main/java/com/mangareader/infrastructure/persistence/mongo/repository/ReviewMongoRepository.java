package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.review.entity.Review;

/**
 * Spring Data MongoDB repository para avaliações.
 */
public interface ReviewMongoRepository extends MongoRepository<Review, String> {
    Optional<Review> findByTitleIdAndUserId(String titleId, String userId);

    long countByTitleId(String titleId);

    Page<Review> findByTitleId(String titleId, Pageable pageable);

    Page<Review> findByUserId(String userId, Pageable pageable);

    long countByUserId(String userId);
}
