package com.mangareader.application.review.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.mangareader.domain.review.entity.ReviewVote;

/**
 * Port de saída — acesso a votos de resenha (MongoDB). DT-45.
 */
public interface ReviewVoteRepositoryPort {
    Optional<ReviewVote> findByRatingIdAndUserId(String ratingId, String userId);

    ReviewVote save(ReviewVote vote);

    void delete(ReviewVote vote);

    /**
     * Votos do usuário para um conjunto de resenhas — resolve {@code myVote}
     * em lote ao montar uma página de avaliações, sem N+1.
     */
    List<ReviewVote> findByRatingIdInAndUserId(Collection<String> ratingIds, String userId);
}
