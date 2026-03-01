package com.mangareader.application.rating.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as avaliações de um título.
 */
@Service
@RequiredArgsConstructor
public class GetRatingsByTitleUseCase {

    private final RatingRepositoryPort ratingRepository;

    public List<MangaRating> execute(String titleId) {
        return ratingRepository.findByTitleId(titleId);
    }
}
