package com.toonlira.application.review.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.review.port.ReviewRepositoryPort;
import com.toonlira.application.review.port.ReviewVoteRepositoryPort;
import com.toonlira.domain.review.entity.Review;
import com.toonlira.domain.review.entity.ReviewVote;
import com.toonlira.shared.application.vote.VoteResult;
import com.toonlira.shared.application.vote.VoteToggle;
import com.toonlira.shared.domain.vote.VoteValue;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra o voto "Útil"/"Contrário" de um usuário em uma resenha. DT-45.
 * <p>
 * Modelo de voto único: a regra do toggle vive em {@link VoteToggle}; aqui
 * ficam a validação (resenha existe, self-vote proibido) e a persistência.
 * Contadores {@code upvotes}/{@code downvotes} ficam desnormalizados no
 * {@link Review} para leitura barata na listagem.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CastReviewVoteUseCase {
    private final ReviewRepositoryPort reviewRepository;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    public VoteResult execute(String reviewId, UUID userId, VoteValue value) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        String voterId = userId.toString();

        if (voterId.equals(review.getUserId())) {
            throw new BusinessRuleException("Não é possível votar na própria resenha", 409);
        }

        ReviewVote existing = reviewVoteRepository.findByRatingIdAndUserId(reviewId, voterId).orElse(null);

        VoteValue myVote = VoteToggle.apply(
                review,
                existing != null ? existing.getValue() : null,
                value,
                new VoteToggle.VoteStore() {
                    @Override
                    public void create(VoteValue v) {
                        reviewVoteRepository.save(ReviewVote.builder()
                                .ratingId(reviewId)
                                .userId(voterId)
                                .value(v)
                                .build());
                    }

                    @Override
                    public void switchTo(VoteValue v) {
                        existing.setValue(v);
                        reviewVoteRepository.save(existing);
                    }

                    @Override
                    public void delete() {
                        reviewVoteRepository.delete(existing);
                    }
                });

        reviewRepository.save(review);

        return new VoteResult(review.getUpvotes(), review.getDownvotes(), myVote);
    }
}
