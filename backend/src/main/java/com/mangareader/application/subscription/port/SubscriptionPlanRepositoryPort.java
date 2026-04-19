package com.mangareader.application.subscription.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.subscription.entity.SubscriptionPlan;

/**
 * Port de saída — acesso a dados de SubscriptionPlans (PostgreSQL).
 */
public interface SubscriptionPlanRepositoryPort {
    List<SubscriptionPlan> findAllActive();

    Page<SubscriptionPlan> findAll(Pageable pageable);

    Optional<SubscriptionPlan> findById(UUID id);

    SubscriptionPlan save(SubscriptionPlan plan);
}
