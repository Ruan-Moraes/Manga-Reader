package com.mangareader.application.subscription.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

/**
 * Port de saída — acesso a dados de Subscriptions (PostgreSQL).
 */
public interface SubscriptionRepositoryPort {
    Subscription save(Subscription subscription);

    Optional<Subscription> findById(UUID id);

    Optional<Subscription> findActiveByUserId(UUID userId);

    Page<Subscription> findByUserId(UUID userId, Pageable pageable);

    void updateStatus(UUID subscriptionId, SubscriptionStatus status);

    Page<Subscription> findAll(SubscriptionStatus status, Pageable pageable);

    Map<SubscriptionStatus, Long> countByStatus();

    /** Monthly new subscriptions: returns [year, month, count] since the given date. */
    List<Object[]> countNewSubscriptionsByMonth(LocalDateTime since);

    /** Monthly cancelled subscriptions: returns [year, month, count] since the given date. */
    List<Object[]> countCancelledSubscriptionsByMonth(LocalDateTime since);
}
