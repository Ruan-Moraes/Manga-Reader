package com.mangareader.application.review.usecase;

import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui uma avaliação (somente o autor pode excluir).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class DeleteReviewUseCase {
    private final ReviewRepositoryPort ratingRepository;
    private final EventPublisherPort eventPublisher;

    @CacheEvict(value = CacheNames.RATING_AVERAGE, allEntries = true)
    public void execute(String ratingId, UUID userId) {
        Review rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", ratingId));

        if (!rating.getUserId().equals(userId.toString())) {
            throw new BusinessRuleException("Você só pode excluir suas próprias avaliações.", 403);
        }

        ratingRepository.deleteById(ratingId);
        eventPublisher.publish("rating.deleted", new RatingEvent(rating.getTitleId(), userId.toString()));
    }
}
