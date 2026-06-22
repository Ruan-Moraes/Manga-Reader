package com.mangareader.application.review.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.application.vote.VoteToggle;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove o voto do usuário em uma resenha, decrementando o contador
 * correspondente. Idempotente: sem voto, apenas retorna os contadores atuais.
 * DT-45.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class RemoveReviewVoteUseCase {
    private final ReviewRepositoryPort reviewRepository;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    public VoteResult execute(String reviewId, UUID userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        reviewVoteRepository.findByRatingIdAndUserId(reviewId, userId.toString())
                .ifPresent(vote -> {
                    VoteToggle.undo(review, vote.getValue());
                    reviewVoteRepository.delete(vote);
                    reviewRepository.save(review);
                });

        return new VoteResult(review.getUpvotes(), review.getDownvotes(), null);
    }
}
