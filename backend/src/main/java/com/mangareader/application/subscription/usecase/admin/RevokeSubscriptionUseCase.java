package com.mangareader.application.subscription.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionAuditPort;
import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Revoga (cancela imediatamente) a assinatura de um usuário (ação administrativa).
 */
@Service
@RequiredArgsConstructor
public class RevokeSubscriptionUseCase {
    private final SubscriptionRepositoryPort subscriptionRepository;
    private final SubscriptionAuditPort auditPort;

    @Transactional
    public Subscription execute(UUID subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));

        subscription.setStatus(SubscriptionStatus.CANCELLED);

        var saved = subscriptionRepository.save(subscription);

        auditPort.log(saved.getId(), saved.getUserId(), "REVOKED", null, "Admin revoked subscription");

        return saved;
    }
}
