package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserRecommendation;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Adiciona um título às recomendações do perfil do usuário.
 * Máximo de {@value #MAX_RECOMMENDATIONS} recomendações por usuário (vitrine do perfil).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AddRecommendationUseCase {
    public static final int MAX_RECOMMENDATIONS = 6;

    private final UserRepositoryPort userRepository;
    private final RecommendationRepositoryPort recommendationRepository;
    private final TitleRepositoryPort titleRepository;
    private final LocaleResolutionService localeResolutionService;

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
                .titleName(localeResolutionService.resolve(title.getName()))
                .titleCover(title.getCover())
                .position((int) count)
                .build();

        return recommendationRepository.save(recommendation);
    }
}
