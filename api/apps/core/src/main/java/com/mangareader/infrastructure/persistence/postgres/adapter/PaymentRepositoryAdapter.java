package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.payment.port.PaymentRepositoryPort;
import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;
import com.mangareader.infrastructure.persistence.postgres.repository.PaymentJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link PaymentRepositoryPort} usando Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class PaymentRepositoryAdapter implements PaymentRepositoryPort {
    private final PaymentJpaRepository repository;

    @Override
    public Optional<Payment> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Payment save(Payment payment) {
        return repository.save(payment);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    @Override
    public Page<Payment> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Page<Payment> findByStatus(PaymentStatus status, Pageable pageable) {
        return repository.findByStatus(status, pageable);
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public long countByStatus(PaymentStatus status) {
        return repository.countByStatus(status);
    }

    @Override
    public BigDecimal sumAmountByStatus(PaymentStatus status) {
        BigDecimal sum = repository.sumAmountByStatus(status);

        return sum != null ? sum : BigDecimal.ZERO;
    }

    @Override
    public List<Object[]> getMonthlyRevenue(LocalDateTime since) {
        return repository.getMonthlyRevenue(since);
    }
}
