package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.infrastructure.persistence.postgres.repository.SubscriptionJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link SubscriptionRepositoryPort} com Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionRepositoryAdapter implements SubscriptionRepositoryPort {
    private final SubscriptionJpaRepository repository;

    @Override
    public Subscription save(Subscription subscription) {
        return repository.save(subscription);
    }

    @Override
    public Optional<Subscription> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Subscription> findActiveByUserId(UUID userId) {
        return repository.findByUserIdAndStatus(userId, SubscriptionStatus.ACTIVE);
    }

    @Override
    public Page<Subscription> findByUserId(UUID userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }

    @Override
    @Transactional
    public void updateStatus(UUID subscriptionId, SubscriptionStatus status) {
        repository.updateStatus(subscriptionId, status);
    }

    @Override
    public Page<Subscription> findAll(SubscriptionStatus status, Pageable pageable) {
        return status != null
                ? repository.findByStatus(status, pageable)
                : repository.findAll(pageable);
    }

    @Override
    public Map<SubscriptionStatus, Long> countByStatus() {
        Map<SubscriptionStatus, Long> result = new EnumMap<>(SubscriptionStatus.class);

        for (Object[] row : repository.countGroupByStatus()) {
            result.put((SubscriptionStatus) row[0], (Long) row[1]);
        }

        return result;
    }

    @Override
    public List<Object[]> countNewSubscriptionsByMonth(LocalDateTime since) {
        return repository.countNewSubscriptionsByMonth(since);
    }

    @Override
    public List<Object[]> countCancelledSubscriptionsByMonth(LocalDateTime since) {
        return repository.countCancelledSubscriptionsByMonth(since);
    }
}
