package com.mangareader.application.rating.usecase;

import java.util.Map;
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
 * Atualiza uma avaliação existente.
 * <p>
 * Verifica se a avaliação pertence ao usuário autenticado.
 */
@Service
@RequiredArgsConstructor
public class UpdateRatingUseCase {

    private final RatingRepositoryPort ratingRepository;
    private final EventPublisherPort eventPublisher;

    public record UpdateRatingInput(
            String ratingId,
            UUID userId,
            Double stars,
            String comment,
            Map<String, Double> categoryRatings
    ) {}

    @CacheEvict(value = CacheNames.RATING_AVERAGE, allEntries = true)
    public MangaRating execute(UpdateRatingInput input) {
        MangaRating rating = ratingRepository.findById(input.ratingId())
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", input.ratingId()));

        if (!rating.getUserId().equals(input.userId().toString())) {
            throw new BusinessRuleException("Você só pode editar suas próprias avaliações", 403);
        }

        if (input.stars() != null) {
            rating.setStars(input.stars());
        }
        if (input.comment() != null) {
            rating.setComment(input.comment());
        }
        if (input.categoryRatings() != null) {
            rating.setCategoryRatings(input.categoryRatings());
        }

        MangaRating saved = ratingRepository.save(rating);
        eventPublisher.publish("rating.updated", new RatingEvent(rating.getTitleId(), input.userId().toString()));
        return saved;
    }
}
