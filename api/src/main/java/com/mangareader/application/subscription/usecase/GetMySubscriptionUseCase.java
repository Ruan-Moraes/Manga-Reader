package com.mangareader.application.subscription.usecase;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a assinatura ativa do usuário autenticado.
 */
@Service
@RequiredArgsConstructor
public class GetMySubscriptionUseCase {
    private final SubscriptionRepositoryPort subscriptionRepository;

    @Transactional(readOnly = true)
    public Optional<Subscription> execute(UUID userId) {
        return subscriptionRepository.findActiveByUserId(userId);
    }
}
