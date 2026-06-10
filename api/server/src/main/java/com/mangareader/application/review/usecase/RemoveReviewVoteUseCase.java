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
    private final ReviewRepositoryPort ratingRepository;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    public VoteResult execute(String ratingId, UUID userId) {
        Review rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", ratingId));

        reviewVoteRepository.findByRatingIdAndUserId(ratingId, userId.toString())
                .ifPresent(vote -> {
                    VoteToggle.undo(rating, vote.getValue());
                    reviewVoteRepository.delete(vote);
                    ratingRepository.save(rating);
                });

        return new VoteResult(rating.getUpvotes(), rating.getDownvotes(), null);
    }
}
