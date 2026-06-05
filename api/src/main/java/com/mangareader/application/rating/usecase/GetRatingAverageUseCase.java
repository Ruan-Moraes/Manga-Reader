package com.mangareader.application.rating.usecase;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
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
        var agg = ratingRepository.aggregateByTitleId(titleId);

        if (agg.count() == 0) {
            return new RatingAverage(0.0, 0);
        }

        return new RatingAverage(
                Math.round(agg.average() * 10.0) / 10.0, agg.count());
    }
}
