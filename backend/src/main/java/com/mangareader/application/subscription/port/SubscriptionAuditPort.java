package com.mangareader.application.subscription.port;

import java.util.UUID;

/**
 * Port para registrar ações de auditoria em assinaturas.
 */
public interface SubscriptionAuditPort {
    void log(UUID subscriptionId, UUID userId, String action, UUID performedBy, String details);
}
