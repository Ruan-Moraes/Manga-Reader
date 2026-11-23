package com.toonlira.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.RecommendationRepositoryPort;
import com.toonlira.shared.exception.ResourceNotFoundException;
import com.toonlira.application.analytics.service.BehaviorEventRecorder;
import com.toonlira.domain.analytics.entity.BehaviorEventType;

import lombok.RequiredArgsConstructor;

/**
 * Remove um título das recomendações do perfil do usuário.
 */
@Service
@RequiredArgsConstructor
public class RemoveRecommendationUseCase {
    private final RecommendationRepositoryPort recommendationRepository;
    private final BehaviorEventRecorder behaviorEventRecorder;

    @Transactional
    public void execute(UUID userId, String titleId) {
        recommendationRepository.findByUserIdAndTitleId(userId, titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation", "titleId", titleId));

        recommendationRepository.deleteByUserIdAndTitleId(userId, titleId);
        behaviorEventRecorder.record(userId, BehaviorEventType.PROFILE_RECOMMENDATION_REMOVED,
                titleId, null, "PROFILE");
    }
}
