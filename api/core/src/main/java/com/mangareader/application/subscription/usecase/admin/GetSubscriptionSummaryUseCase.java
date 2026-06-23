package com.mangareader.application.subscription.usecase.admin;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

import lombok.RequiredArgsConstructor;

/**
 * Retorna contagens de assinaturas agrupadas por status (admin).
 */
@Service
@RequiredArgsConstructor
public class GetSubscriptionSummaryUseCase {
    private final SubscriptionRepositoryPort subscriptionRepository;

    @Transactional(readOnly = true)
    public Map<SubscriptionStatus, Long> execute() {
        return subscriptionRepository.countByStatus();
    }
}
