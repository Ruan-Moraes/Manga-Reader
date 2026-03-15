package com.mangareader.application.user.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.mangareader.domain.user.entity.UserRecommendation;

/**
 * Port de saída — acesso a dados de UserRecommendation (PostgreSQL).
 */
public interface RecommendationRepositoryPort {

    List<UserRecommendation> findByUserIdOrderByPosition(UUID userId);

    Optional<UserRecommendation> findByUserIdAndTitleId(UUID userId, String titleId);

    UserRecommendation save(UserRecommendation recommendation);

    void deleteByUserIdAndTitleId(UUID userId, String titleId);

    long countByUserId(UUID userId);
}
