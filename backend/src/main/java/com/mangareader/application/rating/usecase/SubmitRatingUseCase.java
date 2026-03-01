package com.mangareader.application.rating.usecase;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.domain.user.entity.User;
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

    public record SubmitRatingInput(
            String titleId,
            UUID userId,
            double stars,
            String comment,
            Map<String, Double> categoryRatings
    ) {}

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

        rating.setStars(input.stars());
        rating.setComment(input.comment());
        rating.setUserName(user.getName());

        if (input.categoryRatings() != null) {
            rating.setCategoryRatings(input.categoryRatings());
        }

        return ratingRepository.save(rating);
    }
}
