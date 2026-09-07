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
 * Atualiza uma avaliação existente.
 * <p>
 * Verifica se a avaliação pertence ao usuário autenticado.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class UpdateReviewUseCase {
    private final ReviewRepositoryPort reviewRepository;
    private final EventPublisherPort eventPublisher;
    private final CacheInvalidationPort cacheInvalidation;

    public record UpdateReviewInput(
            String reviewId,
            UUID userId,
            Double funRating,
            Double artRating,
            Double storylineRating,
            Double charactersRating,
            Double originalityRating,
            Double pacingRating,
            String textContent,
            String reviewTitle,
            Boolean spoiler
    ) {}

    public Review execute(UpdateReviewInput input) {
        Review review = reviewRepository.findById(input.reviewId())
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", input.reviewId()));

        if (!review.getUserId().equals(input.userId().toString())) {
            throw new BusinessRuleException("Você só pode editar suas próprias avaliações", 403);
        }

        if (input.funRating() != null) {
            review.setFunRating(input.funRating());
        }

        if (input.artRating() != null) {
            review.setArtRating(input.artRating());
        }

        if (input.storylineRating() != null) {
            review.setStorylineRating(input.storylineRating());
        }

        if (input.charactersRating() != null) {
            review.setCharactersRating(input.charactersRating());
        }

        if (input.originalityRating() != null) {
            review.setOriginalityRating(input.originalityRating());
        }

        if (input.pacingRating() != null) {
            review.setPacingRating(input.pacingRating());
        }

        if (input.textContent() != null) {
            review.setTextContent(input.textContent());
        }

        if (input.reviewTitle() != null) {
            review.setReviewTitle(input.reviewTitle());
        }

        if (input.spoiler() != null) {
            review.setSpoiler(input.spoiler());
        }

        review.setOverallRating(review.calculateOverallRating());

        review.setEdited(true);
        review.setUpdatedAt(java.time.LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        eventPublisher.publish("rating.updated", new RatingEvent(review.getTitleId(), input.userId().toString()));
        cacheInvalidation.evictAfterCommit(CacheNames.RATING_AVERAGE, review.getTitleId());

        return saved;
    }
}
