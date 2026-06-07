package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.rating.entity.ReviewVote;

/**
 * Spring Data MongoDB repository para votos de resenha. DT-45.
 */
public interface ReviewVoteMongoRepository extends MongoRepository<ReviewVote, String> {
    Optional<ReviewVote> findByRatingIdAndUserId(String ratingId, String userId);

    List<ReviewVote> findByRatingIdInAndUserId(Collection<String> ratingIds, String userId);
}
