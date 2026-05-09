package com.mangareader.application.subscription.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

import lombok.RequiredArgsConstructor;

/**
 * Lista todas as assinaturas para o painel administrativo.
 * Suporta filtro opcional por status.
 */
@Service
@RequiredArgsConstructor
public class ListSubscriptionsAdminUseCase {
    private final SubscriptionRepositoryPort subscriptionRepository;

    @Transactional(readOnly = true)
    public Page<Subscription> execute(SubscriptionStatus status, Pageable pageable) {
        Page<Subscription> page = subscriptionRepository.findAll(status, pageable);
        page.getContent().forEach(s -> {
            if (s.getPlan() != null) {
                s.getPlan().getPeriod();
            }
        });
        return page;
    }
}
