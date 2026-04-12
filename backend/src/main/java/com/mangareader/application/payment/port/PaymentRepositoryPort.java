package com.mangareader.application.payment.port;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;

/**
 * Port de saída — acesso a dados de Payments (PostgreSQL).
 */
public interface PaymentRepositoryPort {

    Optional<Payment> findById(UUID id);

    Payment save(Payment payment);

    void deleteById(UUID id);

    Page<Payment> findAll(Pageable pageable);

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);

    long count();

    long countByStatus(PaymentStatus status);

    BigDecimal sumAmountByStatus(PaymentStatus status);

    /** Monthly revenue aggregation: returns [year, month, totalAmount, count] since the given date. */
    List<Object[]> getMonthlyRevenue(LocalDateTime since);
}
