package com.mangareader.application.rating.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public Page<MangaRating> execute(String titleId, Pageable pageable) {
        return ratingRepository.findByTitleId(titleId, pageable);
    }
}
