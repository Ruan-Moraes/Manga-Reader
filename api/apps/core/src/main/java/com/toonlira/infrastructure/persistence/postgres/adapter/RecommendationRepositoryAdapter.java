package com.toonlira.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.toonlira.application.user.port.RecommendationRepositoryPort;
import com.toonlira.domain.user.entity.UserRecommendation;
import com.toonlira.infrastructure.persistence.postgres.repository.RecommendationJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Recommendation ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class RecommendationRepositoryAdapter implements RecommendationRepositoryPort {
    private final RecommendationJpaRepository repository;

    @Override
    public List<UserRecommendation> findByUserIdOrderByPosition(UUID userId) {
        return repository.findByUserIdOrderByPosition(userId);
    }

    @Override
    public Optional<UserRecommendation> findByUserIdAndTitleId(UUID userId, String titleId) {
        return repository.findByUserIdAndTitleId(userId, titleId);
    }

    @Override
    public UserRecommendation save(UserRecommendation recommendation) {
        return repository.save(recommendation);
    }

    @Override
    public void deleteByUserIdAndTitleId(UUID userId, String titleId) {
        repository.deleteByUserIdAndTitleId(userId, titleId);
    }

    @Override
    public long countByUserId(UUID userId) {
        return repository.countByUserId(userId);
    }
}
