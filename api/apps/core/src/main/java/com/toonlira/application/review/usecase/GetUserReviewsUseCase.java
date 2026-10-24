package com.toonlira.application.review.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.toonlira.application.review.port.ReviewRepositoryPort;
import com.toonlira.domain.review.entity.Review;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as avaliações feitas por um usuário (perfil "Minhas avaliações").
 */
@Service
@RequiredArgsConstructor
public class GetUserReviewsUseCase {
    private final ReviewRepositoryPort reviewRepository;

    public Page<Review> execute(UUID userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId.toString(), pageable);
    }
}
