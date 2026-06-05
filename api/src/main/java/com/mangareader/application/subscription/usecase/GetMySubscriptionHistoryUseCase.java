package com.mangareader.application.subscription.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;

import lombok.RequiredArgsConstructor;

/**
 * Retorna o histórico de assinaturas do usuário autenticado (paginado).
 */
@Service
@RequiredArgsConstructor
public class GetMySubscriptionHistoryUseCase {
    private final SubscriptionRepositoryPort subscriptionRepository;

    @Transactional(readOnly = true)
    public Page<Subscription> execute(UUID userId, Pageable pageable) {
        return subscriptionRepository.findByUserId(userId, pageable);
    }
}
