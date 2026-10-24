package com.toonlira.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.user.port.RecommendationRepositoryPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.user.entity.User;
import com.toonlira.domain.user.entity.UserRecommendation;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.exception.ResourceNotFoundException;
import com.toonlira.application.analytics.service.BehaviorEventRecorder;
import com.toonlira.domain.analytics.entity.BehaviorEventType;

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
    private final BehaviorEventRecorder behaviorEventRecorder;

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

        UserRecommendation result = recommendationRepository.save(recommendation);
        behaviorEventRecorder.record(userId, BehaviorEventType.PROFILE_RECOMMENDATION_ADDED,
                titleId, null, "PROFILE");
        return result;
    }
}
