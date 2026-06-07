package com.mangareader.application.rating.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.port.ReviewVoteRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.domain.rating.entity.ReviewVote;
import com.mangareader.domain.rating.valueobject.VoteValue;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra o voto "Útil"/"Contrário" de um usuário em uma resenha. DT-45.
 * <p>
 * Voto único por usuário por resenha (toggle): votar de novo no mesmo lado
 * remove o voto; votar no lado oposto troca. Não é permitido votar na própria
 * resenha. Os contadores ({@code upvotes}/{@code downvotes}) ficam
 * desnormalizados no {@link MangaRating} para leitura barata na listagem.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CastReviewVoteUseCase {
    private final RatingRepositoryPort ratingRepository;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    public ReviewVoteResult execute(String ratingId, UUID userId, VoteValue value) {
        MangaRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", ratingId));

        String voterId = userId.toString();

        if (voterId.equals(rating.getUserId())) {
            throw new BusinessRuleException("Não é possível votar na própria resenha", 409);
        }

        // Não usar Optional.map/orElseGet: o toggle-off retorna null (myVote),
        // o que a Optional.map interpretaria como "vazio" e dispararia o orElseGet.
        ReviewVote existing = reviewVoteRepository.findByRatingIdAndUserId(ratingId, voterId).orElse(null);

        VoteValue myVote = existing != null
                ? applyExistingVote(rating, existing, value)
                : applyNewVote(rating, ratingId, voterId, value);

        ratingRepository.save(rating);

        return new ReviewVoteResult(rating.getUpvotes(), rating.getDownvotes(), myVote);
    }

    /** Sem voto anterior: cria o voto e incrementa o contador correspondente. */
    private VoteValue applyNewVote(MangaRating rating, String ratingId, String voterId, VoteValue value) {
        increment(rating, value, 1);

        reviewVoteRepository.save(ReviewVote.builder()
                .ratingId(ratingId)
                .userId(voterId)
                .value(value)
                .build());

        return value;
    }

    /**
     * Já existe voto: mesmo lado → remove (toggle off); lado oposto → troca,
     * ajustando os dois contadores.
     */
    private VoteValue applyExistingVote(MangaRating rating, ReviewVote existing, VoteValue value) {
        if (existing.getValue() == value) {
            increment(rating, value, -1);
            reviewVoteRepository.delete(existing);
            return null;
        }

        increment(rating, existing.getValue(), -1);
        increment(rating, value, 1);
        existing.setValue(value);
        reviewVoteRepository.save(existing);
        return value;
    }

    private void increment(MangaRating rating, VoteValue value, long delta) {
        if (value == VoteValue.UP) {
            rating.setUpvotes(Math.max(0, rating.getUpvotes() + delta));
        } else {
            rating.setDownvotes(Math.max(0, rating.getDownvotes() + delta));
        }
    }
}
