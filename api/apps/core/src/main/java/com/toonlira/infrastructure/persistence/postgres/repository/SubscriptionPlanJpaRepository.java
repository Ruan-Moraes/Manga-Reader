package com.toonlira.infrastructure.persistence.postgres.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.toonlira.domain.subscription.entity.SubscriptionPlan;

public interface SubscriptionPlanJpaRepository extends JpaRepository<SubscriptionPlan, UUID> {
    List<SubscriptionPlan> findByActiveTrue();
}
