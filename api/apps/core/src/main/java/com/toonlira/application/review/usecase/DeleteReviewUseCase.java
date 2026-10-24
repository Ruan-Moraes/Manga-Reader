package com.toonlira.application.review.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.review.port.ReviewRepositoryPort;
import com.toonlira.application.shared.event.RatingEvent;
import com.toonlira.application.shared.port.EventPublisherPort;
import com.toonlira.application.shared.port.CacheInvalidationPort;
import com.toonlira.domain.review.entity.Review;
import com.toonlira.shared.constant.CacheNames;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;

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
