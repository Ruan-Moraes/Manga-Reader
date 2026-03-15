package com.mangareader.application.rating.usecase;

import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Submete ou atualiza a avaliação de um usuário para um título.
 * <p>
 * Se o usuário já avaliou o título, atualiza a avaliação existente (upsert).
 */
@Service
@RequiredArgsConstructor
public class SubmitRatingUseCase {

    private final RatingRepositoryPort ratingRepository;
    private final UserRepositoryPort userRepository;
    private final TitleRepositoryPort titleRepository;
    private final EventPublisherPort eventPublisher;

    public record SubmitRatingInput(
            String titleId,
            UUID userId,
            double funRating,
            double artRating,
            double storylineRating,
            double charactersRating,
            double originalityRating,
            double pacingRating,
            String comment
    ) {}

    @CacheEvict(value = CacheNames.RATING_AVERAGE, key = "#input.titleId()")
    public MangaRating execute(SubmitRatingInput input) {
        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        // Upsert: atualiza se já existe, cria se não
        MangaRating rating = ratingRepository
                .findByTitleIdAndUserId(input.titleId(), input.userId().toString())
                .orElseGet(() -> MangaRating.builder()
                        .titleId(input.titleId())
                        .userId(input.userId().toString())
                        .userName(user.getName())
                        .build()
                );

        rating.setFunRating(input.funRating());
        rating.setArtRating(input.artRating());
        rating.setStorylineRating(input.storylineRating());
        rating.setCharactersRating(input.charactersRating());
        rating.setOriginalityRating(input.originalityRating());
        rating.setPacingRating(input.pacingRating());
        rating.setOverallRating(rating.calculateOverallRating());
        rating.setComment(input.comment());
        rating.setUserName(user.getName());

        String titleName = titleRepository.findById(input.titleId())
                .map(t -> t.getName())
                .orElse(input.titleId());
        rating.setTitleName(titleName);

        MangaRating saved = ratingRepository.save(rating);
        eventPublisher.publish("rating.submitted", new RatingEvent(input.titleId(), input.userId().toString()));
        return saved;
    }
}
