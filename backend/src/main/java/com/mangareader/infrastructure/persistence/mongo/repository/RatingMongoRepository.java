package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.rating.entity.MangaRating;

/**
 * Spring Data MongoDB repository para avaliações.
 */
public interface RatingMongoRepository extends MongoRepository<MangaRating, String> {

    List<MangaRating> findByTitleId(String titleId);

    Optional<MangaRating> findByTitleIdAndUserId(String titleId, String userId);

    List<MangaRating> findByUserId(String userId);

    long countByTitleId(String titleId);
}
