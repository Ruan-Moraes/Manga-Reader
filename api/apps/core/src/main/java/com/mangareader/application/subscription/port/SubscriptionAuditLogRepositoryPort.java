package com.mangareader.application.subscription.port;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.subscription.entity.SubscriptionAuditLog;

/**
 * Port de saída — acesso a dados de SubscriptionAuditLogs (PostgreSQL).
 */
public interface SubscriptionAuditLogRepositoryPort {
    SubscriptionAuditLog save(SubscriptionAuditLog log);

    Page<SubscriptionAuditLog> findBySubscriptionId(UUID subscriptionId, Pageable pageable);

    Page<SubscriptionAuditLog> findByUserId(UUID userId, Pageable pageable);
}
