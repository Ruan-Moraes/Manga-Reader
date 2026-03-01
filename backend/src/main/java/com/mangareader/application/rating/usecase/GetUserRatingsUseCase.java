package com.mangareader.application.rating.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as avaliações feitas por um usuário (perfil "Minhas avaliações").
 */
@Service
@RequiredArgsConstructor
public class GetUserRatingsUseCase {

    private final RatingRepositoryPort ratingRepository;

    public List<MangaRating> execute(UUID userId) {
        return ratingRepository.findByUserId(userId.toString());
    }
}
