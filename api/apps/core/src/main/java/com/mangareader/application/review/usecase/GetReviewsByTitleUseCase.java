package com.mangareader.application.review.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.domain.review.entity.Review;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as avaliações de um título.
 */
@Service
@RequiredArgsConstructor
public class GetReviewsByTitleUseCase {
    private final ReviewRepositoryPort reviewRepository;

    public Page<Review> execute(String titleId, Integer star, Pageable pageable) {
        return reviewRepository.findByTitleId(titleId, star, pageable);
    }
}
