package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.subscription.port.SubscriptionAuditLogRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionAuditLog;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionAuditLogJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link SubscriptionAuditLogRepositoryPort} com Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionAuditLogRepositoryAdapter implements SubscriptionAuditLogRepositoryPort {

    private final SubscriptionAuditLogJpaRepository repository;

    @Override
    public SubscriptionAuditLog save(SubscriptionAuditLog log) {
        return repository.save(log);
    }

    @Override
    public Page<SubscriptionAuditLog> findBySubscriptionId(UUID subscriptionId, Pageable pageable) {
        return repository.findBySubscriptionId(subscriptionId, pageable);
    }

    @Override
    public Page<SubscriptionAuditLog> findByUserId(UUID userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }
}
