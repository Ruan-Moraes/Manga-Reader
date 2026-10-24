package com.toonlira.translationgateway.infrastructure.persistence;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Must be called inside the application transaction. No storage, retry or content. */
@Component
public class JdbcOriginalRetention {
    static final String ACTIVE_SQL = """
        SELECT EXISTS (SELECT 1 FROM processing_jobs WHERE id = :id AND created_at <= :now
            AND created_at + original_retention_seconds * INTERVAL '1 second' > :now)
        """;
    static final String EXPIRATION_SQL = """
        WITH candidates AS (
            SELECT id, status FROM processing_jobs
            WHERE (CAST(:jobId AS uuid) IS NULL OR id = CAST(:jobId AS uuid))
                AND status IN ('QUEUED', 'OCR', 'TRANSLATING', 'RENDERING', 'CANCEL_PENDING')
                AND created_at <= :now AND created_at + original_retention_seconds * INTERVAL '1 second' <= :now
            ORDER BY created_at, id LIMIT :limit FOR UPDATE SKIP LOCKED
        ), failures AS (
            INSERT INTO processing_job_stages (job_id, stage, status, started_at, completed_at, error_code)
            SELECT id, CASE WHEN status IN ('QUEUED','OCR') THEN 'OCR' ELSE status END,
                'FAILED', :now, :now, CASE WHEN status IN ('QUEUED','OCR') THEN 'ocr-invalid-media'
                    WHEN status = 'TRANSLATING' THEN 'translation-unavailable' ELSE 'internal-error' END
            FROM candidates WHERE status <> 'CANCEL_PENDING'
            ON CONFLICT (job_id, stage) DO UPDATE SET status = 'FAILED',
                started_at = COALESCE(processing_job_stages.started_at, EXCLUDED.started_at),
                completed_at = GREATEST(EXCLUDED.completed_at, processing_job_stages.started_at), error_code = EXCLUDED.error_code
            WHERE processing_job_stages.status IN ('PENDING','RUNNING')
            RETURNING job_id
        ), cancelled_stages AS (
            UPDATE processing_job_stages s SET status = 'CANCELLED',
                completed_at = GREATEST(:now, s.started_at), error_code = NULL
            FROM candidates c WHERE c.id = s.job_id AND c.status = 'CANCEL_PENDING' AND s.status IN ('PENDING','RUNNING')
            RETURNING s.job_id
        ), cancelled_dispatches AS (
            UPDATE processing_job_dispatches d SET status = 'CANCELLED', updated_at = GREATEST(d.updated_at, :now)
            FROM candidates c WHERE c.id = d.job_id AND d.status = 'PENDING' RETURNING d.job_id
        ), updated_jobs AS (
            UPDATE processing_jobs j SET status = CASE WHEN c.status = 'CANCEL_PENDING' THEN 'CANCELLED' ELSE 'FAILED' END,
                error_code = CASE WHEN c.status = 'CANCEL_PENDING' THEN NULL WHEN c.status IN ('QUEUED','OCR') THEN 'ocr-invalid-media'
                    WHEN c.status = 'TRANSLATING' THEN 'translation-unavailable' ELSE 'internal-error' END,
                cancelled_at = CASE WHEN c.status = 'CANCEL_PENDING' THEN GREATEST(j.updated_at, :now) ELSE j.cancelled_at END,
                updated_at = GREATEST(j.updated_at, :now)
            FROM candidates c WHERE c.id = j.id RETURNING j.id
        ), enqueued AS (
            INSERT INTO processing_job_lifecycle_cleanups (job_id, cleanup_scope, requested_at, next_attempt_at)
            SELECT id, 'ALL', :now, :now FROM updated_jobs ON CONFLICT (job_id) DO NOTHING RETURNING job_id
        ) SELECT count(*) FROM updated_jobs
        """;
    private final JdbcClient jdbc;
    private final Clock clock;
    public JdbcOriginalRetention(JdbcClient jdbc, Clock clock) { this.jdbc = jdbc; this.clock = clock; }

    public boolean available(UUID jobId, Instant observedAt) {
        return jdbc.sql(ACTIVE_SQL).param("id", jobId).param("now", timestamp(effectiveNow(observedAt))).query(Boolean.class).single();
    }
    public int expire(int limit, UUID jobId, Instant observedAt) {
        if (limit < 1 || limit > 100) throw new IllegalArgumentException("Invalid original expiry batch");
        return jdbc.sql(EXPIRATION_SQL).param("jobId", jobId).param("limit", limit)
            .param("now", timestamp(effectiveNow(observedAt))).query(Integer.class).single();
    }
    Instant effectiveNow(Instant observedAt) {
        var current = clock.instant();
        return observedAt.isAfter(current) ? observedAt : current;
    }
    private static OffsetDateTime timestamp(Instant now) { return OffsetDateTime.ofInstant(now, ZoneOffset.UTC); }
}
