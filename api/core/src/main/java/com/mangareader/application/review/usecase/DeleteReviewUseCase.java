package com.mangareader.application.review.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.application.shared.port.CacheInvalidationPort;
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
    private final ReviewRepositoryPort reviewRepository;
    private final EventPublisherPort eventPublisher;
    private final CacheInvalidationPort cacheInvalidation;

    public void execute(String reviewId, UUID userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUserId().equals(userId.toString())) {
            throw new BusinessRuleException("Você só pode excluir suas próprias avaliações.", 403);
        }

        reviewRepository.deleteById(reviewId);
        eventPublisher.publish("rating.deleted", new RatingEvent(review.getTitleId(), userId.toString()));
        cacheInvalidation.evictAfterCommit(CacheNames.RATING_AVERAGE, review.getTitleId());
    }
}
