package com.toonlira.application.review.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.review.port.ReviewRepositoryPort;
import com.toonlira.application.review.port.ReviewVoteRepositoryPort;
import com.toonlira.domain.review.entity.Review;
import com.toonlira.shared.application.vote.VoteResult;
import com.toonlira.shared.application.vote.VoteToggle;
import com.toonlira.shared.exception.ResourceNotFoundException;

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
