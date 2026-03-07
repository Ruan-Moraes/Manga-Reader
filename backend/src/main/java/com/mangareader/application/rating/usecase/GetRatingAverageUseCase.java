package com.mangareader.application.rating.usecase;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.shared.constant.CacheNames;

import lombok.RequiredArgsConstructor;

/**
 * Calcula a média de estrelas e a contagem de avaliações de um título.
 */
@Service
@RequiredArgsConstructor
public class GetRatingAverageUseCase {

    private final RatingRepositoryPort ratingRepository;

    public record RatingAverage(double average, long count) {}

    @Cacheable(value = CacheNames.RATING_AVERAGE, key = "#titleId")
    public RatingAverage execute(String titleId) {
        List<MangaRating> ratings = ratingRepository.findByTitleId(titleId);

        if (ratings.isEmpty()) {
            return new RatingAverage(0.0, 0);
        }

        double avg = ratings.stream()
                .mapToDouble(MangaRating::getStars)
                .average()
                .orElse(0.0);

        return new RatingAverage(Math.round(avg * 10.0) / 10.0, ratings.size());
    }
}
