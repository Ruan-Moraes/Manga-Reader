package com.mangareader.application.rating.usecase;

import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui uma avaliação (somente o autor pode excluir).
 */
@Service
@RequiredArgsConstructor
public class DeleteRatingUseCase {

    private final RatingRepositoryPort ratingRepository;
    private final EventPublisherPort eventPublisher;

    @CacheEvict(value = CacheNames.RATING_AVERAGE, allEntries = true)
    public void execute(String ratingId, UUID userId) {
        MangaRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", ratingId));

        if (!rating.getUserId().equals(userId.toString())) {
            throw new BusinessRuleException("Você só pode excluir suas próprias avaliações.", 403);
        }

        ratingRepository.deleteById(ratingId);
        eventPublisher.publish("rating.deleted", new RatingEvent(rating.getTitleId(), userId.toString()));
    }
}
