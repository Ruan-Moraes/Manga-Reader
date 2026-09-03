package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionPlanJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link SubscriptionPlanRepositoryPort} com Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionPlanRepositoryAdapter implements SubscriptionPlanRepositoryPort {
    private final SubscriptionPlanJpaRepository repository;

    @Override
    public List<SubscriptionPlan> findAllActive() {
        return repository.findByActiveTrue();
    }

    @Override
    public Page<SubscriptionPlan> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Optional<SubscriptionPlan> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public SubscriptionPlan save(SubscriptionPlan plan) {
        return repository.save(plan);
    }
}
