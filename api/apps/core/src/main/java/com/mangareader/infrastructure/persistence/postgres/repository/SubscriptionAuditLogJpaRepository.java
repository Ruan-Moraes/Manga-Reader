package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.subscription.entity.SubscriptionAuditLog;

public interface SubscriptionAuditLogJpaRepository extends JpaRepository<SubscriptionAuditLog, UUID> {
    Page<SubscriptionAuditLog> findBySubscriptionId(UUID subscriptionId, Pageable pageable);

    Page<SubscriptionAuditLog> findByUserId(UUID userId, Pageable pageable);
}
