package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserRecommendation;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Adiciona um título às recomendações do perfil do usuário.
 * Máximo de 10 recomendações por usuário.
 */
@Service
@RequiredArgsConstructor
public class AddRecommendationUseCase {

    private static final int MAX_RECOMMENDATIONS = 10;

    private final UserRepositoryPort userRepository;
    private final RecommendationRepositoryPort recommendationRepository;
    private final TitleRepositoryPort titleRepository;

    public UserRecommendation execute(UUID userId, String titleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (recommendationRepository.findByUserIdAndTitleId(userId, titleId).isPresent()) {
            throw new IllegalStateException("Título já está nas recomendações");
        }

        long count = recommendationRepository.countByUserId(userId);
        if (count >= MAX_RECOMMENDATIONS) {
            throw new IllegalStateException("Máximo de " + MAX_RECOMMENDATIONS + " recomendações atingido");
        }

        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        UserRecommendation recommendation = UserRecommendation.builder()
                .user(user)
                .titleId(titleId)
                .titleName(title.getName())
                .titleCover(title.getCover())
                .position((int) count)
                .build();

        return recommendationRepository.save(recommendation);
    }
}
