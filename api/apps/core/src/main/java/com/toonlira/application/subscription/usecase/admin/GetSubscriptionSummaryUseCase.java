package com.toonlira.application.subscription.usecase.admin;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.subscription.port.SubscriptionRepositoryPort;
import com.toonlira.domain.subscription.valueobject.SubscriptionStatus;

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
