package com.mangareader.application.rating.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.port.ReviewVoteRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.domain.rating.entity.ReviewVote;
import com.mangareader.shared.application.vote.VoteResult;
import com.mangareader.shared.application.vote.VoteToggle;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra o voto "Útil"/"Contrário" de um usuário em uma resenha. DT-45.
 * <p>
 * Modelo de voto único: a regra do toggle vive em {@link VoteToggle}; aqui
 * ficam a validação (resenha existe, self-vote proibido) e a persistência.
 * Contadores {@code upvotes}/{@code downvotes} ficam desnormalizados no
 * {@link MangaRating} para leitura barata na listagem.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CastReviewVoteUseCase {
    private final RatingRepositoryPort ratingRepository;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    public VoteResult execute(String ratingId, UUID userId, VoteValue value) {
        MangaRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", ratingId));

        String voterId = userId.toString();

        if (voterId.equals(rating.getUserId())) {
            throw new BusinessRuleException("Não é possível votar na própria resenha", 409);
        }

        ReviewVote existing = reviewVoteRepository.findByRatingIdAndUserId(ratingId, voterId).orElse(null);

        VoteValue myVote = VoteToggle.apply(
                rating,
                existing != null ? existing.getValue() : null,
                value,
                new VoteToggle.VoteStore() {
                    @Override
                    public void create(VoteValue v) {
                        reviewVoteRepository.save(ReviewVote.builder()
                                .ratingId(ratingId)
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

        ratingRepository.save(rating);

        return new VoteResult(rating.getUpvotes(), rating.getDownvotes(), myVote);
    }
}
