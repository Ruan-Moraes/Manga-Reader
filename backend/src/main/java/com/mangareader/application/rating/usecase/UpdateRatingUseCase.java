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
            Double funRating,
            Double artRating,
            Double storylineRating,
            Double charactersRating,
            Double originalityRating,
            Double pacingRating,
            String comment
    ) {}

    @CacheEvict(value = CacheNames.RATING_AVERAGE, allEntries = true)
    public MangaRating execute(UpdateRatingInput input) {
        MangaRating rating = ratingRepository.findById(input.ratingId())
                .orElseThrow(() -> new ResourceNotFoundException("Rating", "id", input.ratingId()));

        if (!rating.getUserId().equals(input.userId().toString())) {
            throw new BusinessRuleException("Você só pode editar suas próprias avaliações", 403);
        }

        if (input.funRating() != null) {
            rating.setFunRating(input.funRating());
        }
        if (input.artRating() != null) {
            rating.setArtRating(input.artRating());
        }
        if (input.storylineRating() != null) {
            rating.setStorylineRating(input.storylineRating());
        }
        if (input.charactersRating() != null) {
            rating.setCharactersRating(input.charactersRating());
        }
        if (input.originalityRating() != null) {
            rating.setOriginalityRating(input.originalityRating());
        }
        if (input.pacingRating() != null) {
            rating.setPacingRating(input.pacingRating());
        }
        if (input.comment() != null) {
            rating.setComment(input.comment());
        }

        rating.setOverallRating(rating.calculateOverallRating());

        MangaRating saved = ratingRepository.save(rating);
        eventPublisher.publish("rating.updated", new RatingEvent(rating.getTitleId(), input.userId().toString()));
        return saved;
    }
}
