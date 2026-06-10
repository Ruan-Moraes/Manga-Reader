package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.domain.review.entity.ReviewVote;
import com.mangareader.infrastructure.persistence.mongo.repository.ReviewVoteMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de ReviewVote ao Spring Data MongoDB. DT-45.
 */
@Component
@RequiredArgsConstructor
public class ReviewVoteRepositoryAdapter implements ReviewVoteRepositoryPort {
    private final ReviewVoteMongoRepository repository;

    @Override
    public Optional<ReviewVote> findByRatingIdAndUserId(String ratingId, String userId) {
        return repository.findByRatingIdAndUserId(ratingId, userId);
    }

    @Override
    public ReviewVote save(ReviewVote vote) {
        return repository.save(vote);
    }

    @Override
    public void delete(ReviewVote vote) {
        repository.delete(vote);
    }

    @Override
    public List<ReviewVote> findByRatingIdInAndUserId(Collection<String> ratingIds, String userId) {
        return repository.findByRatingIdInAndUserId(ratingIds, userId);
    }
}
