package com.toonlira.translationgateway.infrastructure.persistence;

import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcLifecycleCleanupRepository implements LifecycleCleanupRepository {
    private static final String ELIGIBILITY = """
        (j.status IN ('FAILED', 'CANCELLED') OR
            (j.status IN ('READY', 'RESULT_EXPIRED') AND EXISTS (
                SELECT 1 FROM processing_job_stages s
                WHERE s.job_id = j.id AND s.stage = 'RENDERING' AND s.status = 'SUCCEEDED')))
        """;
    static final String RECONCILIATION_CANDIDATES = """
        SELECT j.id, CASE WHEN j.status IN ('FAILED', 'CANCELLED') THEN 'ALL' ELSE 'ORIGINAL' END AS scope
        FROM processing_jobs j
        WHERE %s AND NOT EXISTS (
            SELECT 1 FROM processing_job_lifecycle_cleanups c WHERE c.job_id = j.id)
        ORDER BY j.created_at, j.id LIMIT :limit FOR UPDATE OF j SKIP LOCKED
        """.formatted(ELIGIBILITY);
    private final JdbcClient jdbc;

    public JdbcLifecycleCleanupRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Override
    public void enqueueEligible(UUID jobId, Instant now) {
        jdbc.sql("""
                WITH candidate AS (
                    SELECT j.id, CASE WHEN j.status IN ('FAILED', 'CANCELLED') THEN 'ALL' ELSE 'ORIGINAL' END AS scope
                    FROM processing_jobs j WHERE j.id = :id AND %s FOR UPDATE OF j
                )
                INSERT INTO processing_job_lifecycle_cleanups (job_id, cleanup_scope, requested_at, next_attempt_at)
                SELECT id, scope, :now, :now FROM candidate ON CONFLICT (job_id) DO NOTHING
                """.formatted(ELIGIBILITY)).param("id", jobId).param("now", timestamp(now)).update();
    }

    @Override
    public int reconcile(int limit, Instant now) {
        validateLimit(limit);
        return jdbc.sql("""
                WITH candidates AS (%s)
                INSERT INTO processing_job_lifecycle_cleanups (job_id, cleanup_scope, requested_at, next_attempt_at)
                SELECT id, scope, :now, :now FROM candidates ON CONFLICT (job_id) DO NOTHING
                """.formatted(RECONCILIATION_CANDIDATES)).param("limit", limit).param("now", timestamp(now)).update();
    }

    @Override
    public List<CleanupClaim> claim(int limit, Instant now, Instant leaseUntil) {
        validateLimit(limit);
        if (now == null || leaseUntil == null || !leaseUntil.isAfter(now)) {
            throw new IllegalArgumentException("Invalid lifecycle cleanup lease");
        }
        var ids = jdbc.sql("""
                WITH candidates AS (
                    SELECT job_id FROM processing_job_lifecycle_cleanups
                    WHERE completed_at IS NULL AND next_attempt_at <= :now
                    ORDER BY next_attempt_at, job_id FOR UPDATE SKIP LOCKED LIMIT :limit
                )
                UPDATE processing_job_lifecycle_cleanups c SET next_attempt_at = :lease
                FROM candidates selected WHERE c.job_id = selected.job_id RETURNING c.job_id
                """).param("limit", limit).param("now", timestamp(now)).param("lease", timestamp(leaseUntil))
            .query(UUID.class).list();
        return loadClaims(ids, leaseUntil);
    }

    @Override
    public Optional<CleanupClaim> claimForJob(UUID jobId, Instant now, Instant leaseUntil) {
        if (jobId == null || now == null || leaseUntil == null || !leaseUntil.isAfter(now)) {
            throw new IllegalArgumentException("Invalid lifecycle cleanup lookup");
        }
        var ids = jdbc.sql("""
                WITH candidate AS (
                    SELECT job_id FROM processing_job_lifecycle_cleanups
                    WHERE job_id = :id AND completed_at IS NULL AND next_attempt_at <= :now
                    FOR UPDATE SKIP LOCKED
                )
                UPDATE processing_job_lifecycle_cleanups c SET next_attempt_at = :lease
                FROM candidate selected WHERE c.job_id = selected.job_id RETURNING c.job_id
                """).param("id", jobId).param("now", timestamp(now)).param("lease", timestamp(leaseUntil))
            .query(UUID.class).list();
        return loadClaims(ids, leaseUntil).stream().findFirst();
    }

    private List<CleanupClaim> loadClaims(List<UUID> ids, Instant leaseUntil) {
        if (ids.isEmpty()) return List.of();
        var keys = new LinkedHashMap<UUID, List<String>>();
        ids.forEach(id -> keys.put(id, new ArrayList<>()));
        jdbc.sql("""
                SELECT j.id AS job_id, j.original_object_key AS object_key FROM processing_jobs j WHERE j.id IN (:ids)
                UNION
                SELECT s.job_id, s.output_object_key FROM processing_job_stages s
                    JOIN processing_job_lifecycle_cleanups c ON c.job_id = s.job_id AND c.cleanup_scope = 'ALL'
                    WHERE s.job_id IN (:ids) AND s.output_object_key IS NOT NULL
                UNION
                SELECT s.job_id, s.rendered_image_object_key FROM processing_job_stages s
                    JOIN processing_job_lifecycle_cleanups c ON c.job_id = s.job_id AND c.cleanup_scope = 'ALL'
                    WHERE s.job_id IN (:ids) AND s.rendered_image_object_key IS NOT NULL
                UNION
                SELECT l.job_id, l.output_object_key FROM processing_job_layouts l
                    JOIN processing_job_lifecycle_cleanups c ON c.job_id = l.job_id AND c.cleanup_scope = 'ALL'
                    WHERE l.job_id IN (:ids) AND l.output_object_key IS NOT NULL
                ORDER BY job_id, object_key
                """).param("ids", ids).query((row, ignored) -> {
                keys.get(row.getObject("job_id", UUID.class)).add(row.getString("object_key"));
                return 0;
            }).list();
        return ids.stream().map(id -> new CleanupClaim(id, leaseUntil, keys.get(id))).toList();
    }

    @Override
    public boolean complete(UUID jobId, Instant leaseUntil, Instant now) {
        return jdbc.sql("""
                UPDATE processing_job_lifecycle_cleanups SET completed_at = :now
                WHERE job_id = :id AND completed_at IS NULL AND next_attempt_at = :lease
                """).param("id", jobId).param("now", timestamp(now)).param("lease", timestamp(leaseUntil)).update() == 1;
    }

    @Override
    public void reschedule(UUID jobId, Instant leaseUntil, Instant nextAttemptAt) {
        jdbc.sql("""
                UPDATE processing_job_lifecycle_cleanups SET next_attempt_at = :next
                WHERE job_id = :id AND completed_at IS NULL AND next_attempt_at = :lease
                """).param("id", jobId).param("lease", timestamp(leaseUntil)).param("next", timestamp(nextAttemptAt)).update();
    }

    private static void validateLimit(int limit) {
        if (limit < 1 || limit > 100) throw new IllegalArgumentException("Invalid lifecycle cleanup batch");
    }
    private static OffsetDateTime timestamp(Instant value) { return OffsetDateTime.ofInstant(value, ZoneOffset.UTC); }
}
