package com.mangareader.infrastructure.persistence.postgres.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;

/**
 * Repositório JPA para pagamentos.
 */
public interface PaymentJpaRepository extends JpaRepository<Payment, UUID> {

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);

    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(PaymentStatus status);

    @Query("SELECT YEAR(p.paidAt), MONTH(p.paidAt), COALESCE(SUM(p.amount), 0), COUNT(p) "
            + "FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt >= :since "
            + "GROUP BY YEAR(p.paidAt), MONTH(p.paidAt) "
            + "ORDER BY YEAR(p.paidAt), MONTH(p.paidAt)")
    List<Object[]> getMonthlyRevenue(LocalDateTime since);
}
