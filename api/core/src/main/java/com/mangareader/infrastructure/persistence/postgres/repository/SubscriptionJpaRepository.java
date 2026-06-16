package com.mangareader.infrastructure.persistence.postgres.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;

public interface SubscriptionJpaRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByUserIdAndStatus(UUID userId, SubscriptionStatus status);

    Page<Subscription> findByUserId(UUID userId, Pageable pageable);

    Page<Subscription> findByStatus(SubscriptionStatus status, Pageable pageable);

    @Modifying
    @Query("UPDATE Subscription s SET s.status = :status WHERE s.id = :id")
    void updateStatus(@Param("id") UUID id, @Param("status") SubscriptionStatus status);

    @Query("SELECT s.status, COUNT(s) FROM Subscription s GROUP BY s.status")
    List<Object[]> countGroupByStatus();

    @Query("SELECT YEAR(s.startDate), MONTH(s.startDate), COUNT(s) "
            + "FROM Subscription s WHERE s.startDate >= :since "
            + "GROUP BY YEAR(s.startDate), MONTH(s.startDate) "
            + "ORDER BY YEAR(s.startDate), MONTH(s.startDate)")
    List<Object[]> countNewSubscriptionsByMonth(@Param("since") LocalDateTime since);

    @Query("SELECT YEAR(s.updatedAt), MONTH(s.updatedAt), COUNT(s) "
            + "FROM Subscription s WHERE s.status = 'CANCELLED' AND s.updatedAt >= :since "
            + "GROUP BY YEAR(s.updatedAt), MONTH(s.updatedAt) "
            + "ORDER BY YEAR(s.updatedAt), MONTH(s.updatedAt)")
    List<Object[]> countCancelledSubscriptionsByMonth(@Param("since") LocalDateTime since);
}
