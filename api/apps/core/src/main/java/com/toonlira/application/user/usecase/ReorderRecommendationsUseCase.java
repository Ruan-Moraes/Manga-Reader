package com.toonlira.application.user.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.RecommendationRepositoryPort;
import com.toonlira.domain.user.entity.UserRecommendation;

import lombok.RequiredArgsConstructor;
import com.toonlira.application.analytics.service.BehaviorEventRecorder;
import com.toonlira.domain.analytics.entity.BehaviorEventType;

/**
 * Reordena as recomendações do perfil do usuário.
 */
@Service
@RequiredArgsConstructor
public class ReorderRecommendationsUseCase {
    private final RecommendationRepositoryPort recommendationRepository;
    private final BehaviorEventRecorder behaviorEventRecorder;

    @Transactional
    public List<UserRecommendation> execute(UUID userId, List<String> titleIdsInOrder) {
        for (int i = 0; i < titleIdsInOrder.size(); i++) {
            var rec = recommendationRepository.findByUserIdAndTitleId(userId, titleIdsInOrder.get(i));

            if (rec.isPresent()) {
                rec.get().setPosition(i);
                recommendationRepository.save(rec.get());
            }
        }

        List<UserRecommendation> result = recommendationRepository.findByUserIdOrderByPosition(userId);
        behaviorEventRecorder.record(userId, BehaviorEventType.PROFILE_RECOMMENDATION_REORDERED,
                null, null, "PROFILE");
        return result;
    }
}
