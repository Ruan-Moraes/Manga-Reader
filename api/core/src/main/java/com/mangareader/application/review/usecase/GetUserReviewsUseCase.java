package com.mangareader.application.review.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.domain.review.entity.Review;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as avaliações feitas por um usuário (perfil "Minhas avaliações").
 */
@Service
@RequiredArgsConstructor
public class GetUserReviewsUseCase {
    private final ReviewRepositoryPort ratingRepository;

    public Page<Review> execute(UUID userId, Pageable pageable) {
        return ratingRepository.findByUserId(userId.toString(), pageable);
    }
}
