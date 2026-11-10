package com.toonlira.translationgateway.infrastructure.persistence;

import com.toonlira.translationgateway.application.port.VolatileAttemptRepository;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcVolatileAttemptRepository implements VolatileAttemptRepository {
    private final JdbcClient jdbc;
    private final GatewayProperties properties;
    public JdbcVolatileAttemptRepository(JdbcClient jdbc, GatewayProperties properties) {
        this.jdbc = jdbc; this.properties = properties;
    }

    @Override public Optional<Receipt> find(UUID installation, UUID key) {
        return jdbc.sql("SELECT operation_ref,status,created_at,finished_at,error_code FROM volatile_processing_attempts WHERE installation_id=:owner AND idempotency_key=:key")
            .param("owner", installation).param("key", key).query((rs, row) -> new Receipt(rs.getObject(1, UUID.class),
                Status.valueOf(rs.getString(2)), rs.getTimestamp(3).toInstant(),
                rs.getTimestamp(4) == null ? null : rs.getTimestamp(4).toInstant(), rs.getString(5))).optional();
    }

    @Override public Receipt reserve(UUID installation, UUID key, UUID operation, Instant now, int installationQuota, int globalQuota) {
        var date = now.atZone(ZoneOffset.UTC).toLocalDate();
        jdbc.sql("SELECT pg_advisory_xact_lock(17055, :day)").param("day", Math.toIntExact(date.toEpochDay())).query((row, ignored) -> { row.getObject(1); return 0; }).single();
        var active = jdbc.sql("SELECT status FROM anonymous_installations WHERE id=:owner FOR SHARE")
            .param("owner", installation).query(String.class).optional();
        if (active.isEmpty() || !"ACTIVE".equals(active.get()))
            throw new GatewayException(GatewayErrorCode.INSTALLATION_REVOKED, 403, false);
        if (find(installation, key).isPresent()) throw new GatewayException(GatewayErrorCode.JOB_STATE_CONFLICT, 409, false);
        var start = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        var end = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        var counts = jdbc.sql("""
            SELECT count(*) AS total,count(*) FILTER (WHERE installation_id=:owner) AS owned
            FROM volatile_processing_attempts WHERE created_at>=:start AND created_at<:end
            """).param("owner", installation).param("start", start.atOffset(ZoneOffset.UTC)).param("end", end.atOffset(ZoneOffset.UTC))
            .query((rs, row) -> new long[]{rs.getLong(1), rs.getLong(2)}).single();
        if (counts[0] >= globalQuota || counts[1] >= installationQuota) throw new GatewayException(GatewayErrorCode.QUOTA_EXCEEDED, 429, false);
        reserveTestBudget(now);
        jdbc.sql("""
            INSERT INTO volatile_processing_attempts(operation_ref,installation_id,idempotency_key,status,created_at)
            VALUES (:ref,:owner,:key,'STARTED',:now)
            """).param("ref", operation).param("owner", installation).param("key", key).param("now", now.atOffset(ZoneOffset.UTC)).update();
        return new Receipt(operation, Status.STARTED, now, null, null);
    }

    private void reserveTestBudget(Instant now) {
        var budget = properties.getTestBudget();
        if (!budget.isEnabled()) return;
        if (budget.getMaxAttempts() < 1 || budget.getDeadline() == null || !now.isBefore(budget.getDeadline()))
            throw new GatewayException(GatewayErrorCode.QUOTA_EXCEEDED, 429, false);
        var reserved = jdbc.sql("""
            INSERT INTO volatile_test_budget_window(window_key, attempts_reserved)
            SELECT 'private-test', 1 WHERE clock_timestamp() < :deadline
            ON CONFLICT (window_key) DO UPDATE
            SET attempts_reserved = volatile_test_budget_window.attempts_reserved + 1
            WHERE volatile_test_budget_window.attempts_reserved < :maximum AND clock_timestamp() < :deadline
            RETURNING attempts_reserved
            """).param("maximum", budget.getMaxAttempts()).param("deadline", budget.getDeadline().atOffset(ZoneOffset.UTC))
            .query(Long.class).optional();
        if (reserved.isEmpty()) throw new GatewayException(GatewayErrorCode.QUOTA_EXCEEDED, 429, false);
    }

    @Override public void finish(UUID operation, Status status, String error, Instant now) {
        if (status == Status.STARTED) throw new IllegalArgumentException("Invalid receipt transition");
        int updated = jdbc.sql("""
            UPDATE volatile_processing_attempts SET status=:status,error_code=:error,finished_at=:now
            WHERE operation_ref=:ref AND status='STARTED'
            """).param("status", status.name()).param("error", error).param("now", now.atOffset(ZoneOffset.UTC)).param("ref", operation).update();
        if (updated != 1) throw new GatewayException(GatewayErrorCode.JOB_STATE_CONFLICT, 409, false);
    }
    @Override public int deleteExpired(Instant cutoff, int limit) {
        if (limit < 1 || limit > 1000) throw new IllegalArgumentException("Invalid receipt cleanup limit");
        return jdbc.sql("""
            DELETE FROM volatile_processing_attempts WHERE operation_ref IN (
                SELECT operation_ref FROM volatile_processing_attempts WHERE created_at<=:cutoff
                  AND ('x' || substring(replace(idempotency_key::text,'-',''),1,12))::bit(48)::bigint<=:keyCutoffMillis
                ORDER BY created_at LIMIT :limit
            )
            """).param("cutoff", cutoff.atOffset(ZoneOffset.UTC)).param("keyCutoffMillis", cutoff.toEpochMilli()).param("limit", limit).update();
    }
}
