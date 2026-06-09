package com.mangareader.application.rating.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.port.ReviewVoteRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.domain.vote.VoteValue;
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
    private final RatingRepositoryPort ratingRepository;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    public VoteResult execute(String ratingId, UUID userId) {
        MangaRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", ratingId));

        reviewVoteRepository.findByRatingIdAndUserId(ratingId, userId.toString())
                .ifPresent(vote -> {
                    if (vote.getValue() == VoteValue.UP) {
                        rating.setUpvotes(Math.max(0, rating.getUpvotes() - 1));
                    } else {
                        rating.setDownvotes(Math.max(0, rating.getDownvotes() - 1));
                    }

                    reviewVoteRepository.delete(vote);
                    ratingRepository.save(rating);
                });

        return new VoteResult(rating.getUpvotes(), rating.getDownvotes(), null);
    }
}
