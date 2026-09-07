package com.toonlira.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.toonlira.domain.user.entity.UserRecommendation;

/**
 * Spring Data JPA repository para recomendações de usuários.
 */
public interface RecommendationJpaRepository extends JpaRepository<UserRecommendation, UUID> {
    List<UserRecommendation> findByUserIdOrderByPosition(UUID userId);

    Optional<UserRecommendation> findByUserIdAndTitleId(UUID userId, String titleId);

    void deleteByUserIdAndTitleId(UUID userId, String titleId);

    long countByUserId(UUID userId);
}
