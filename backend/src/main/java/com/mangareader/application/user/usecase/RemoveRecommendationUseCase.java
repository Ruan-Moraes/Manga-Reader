package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove um título das recomendações do perfil do usuário.
 */
@Service
@RequiredArgsConstructor
public class RemoveRecommendationUseCase {

    private final RecommendationRepositoryPort recommendationRepository;

    @Transactional
    public void execute(UUID userId, String titleId) {
        recommendationRepository.findByUserIdAndTitleId(userId, titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation", "titleId", titleId));

        recommendationRepository.deleteByUserIdAndTitleId(userId, titleId);
    }
}
