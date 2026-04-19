package com.mangareader.application.subscription.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza o status de uma assinatura específica (admin).
 */
@Service
@RequiredArgsConstructor
public class UpdateSubscriptionStatusAdminUseCase {
    private final SubscriptionRepositoryPort subscriptionRepository;

    @Transactional
    public Subscription execute(UUID subscriptionId, SubscriptionStatus newStatus) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", "id", subscriptionId));

        subscription.setStatus(newStatus);
        return subscriptionRepository.save(subscription);
    }
}
