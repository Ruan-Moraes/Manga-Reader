package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mangareader.application.subscription.port.SubscriptionAuditPort;
import com.mangareader.domain.subscription.entity.SubscriptionAuditLog;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionAuditLogJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link SubscriptionAuditPort} — persiste logs de auditoria.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionAuditAdapter implements SubscriptionAuditPort {
    private final SubscriptionAuditLogJpaRepository repository;

    @Override
    public void log(UUID subscriptionId, UUID userId, String action, UUID performedBy, String details) {
        var auditLog = SubscriptionAuditLog.builder()
                .subscriptionId(subscriptionId)
                .userId(userId)
                .action(action)
                .performedBy(performedBy)
                .details(details)
                .build();

        repository.save(auditLog);
    }
}
