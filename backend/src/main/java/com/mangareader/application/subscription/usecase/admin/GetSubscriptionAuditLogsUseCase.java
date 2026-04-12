package com.mangareader.application.subscription.usecase.admin;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionAuditLogRepositoryPort;
import com.mangareader.domain.subscription.entity.SubscriptionAuditLog;

import lombok.RequiredArgsConstructor;

/**
 * Consulta logs de auditoria de assinaturas (admin).
 */
@Service
@RequiredArgsConstructor
public class GetSubscriptionAuditLogsUseCase {

    private final SubscriptionAuditLogRepositoryPort auditLogRepository;

    @Transactional(readOnly = true)
    public Page<SubscriptionAuditLog> executeBySubscription(UUID subscriptionId, Pageable pageable) {
        return auditLogRepository.findBySubscriptionId(subscriptionId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<SubscriptionAuditLog> executeByUser(UUID userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }
}
