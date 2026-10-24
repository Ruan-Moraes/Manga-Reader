package com.toonlira.translationgateway.infrastructure.persistence;

import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcResultAcknowledgementRepository implements ResultAcknowledgementRepository {
    static final String EXPIRATION_BATCH_CANDIDATES = """
        SELECT j.id FROM processing_jobs j
        LEFT JOIN processing_job_stages s ON s.job_id = j.id
            AND s.stage = 'RENDERING' AND s.status = 'SUCCEEDED'
        WHERE j.status = 'READY' AND (
            COALESCE(s.result_expires_at, COALESCE(s.completed_at, j.updated_at) + j.result_retention_seconds * INTERVAL '1 second') <= :now
            OR COALESCE(s.completed_at, j.updated_at) <= :cutoff)
        ORDER BY COALESCE(s.completed_at, j.updated_at), j.id
        LIMIT :limit FOR UPDATE OF j SKIP LOCKED
        """;
    private final JdbcClient jdbc;

    public JdbcResultAcknowledgementRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Override
    public void request(UUID installationId, UUID jobRef, Instant now) {
        var job = jdbc.sql("""
                SELECT id, status FROM processing_jobs
                WHERE installation_id = :installationId AND job_ref = :jobRef FOR UPDATE
                """).param("installationId", installationId).param("jobRef", jobRef)
            .query((row, ignored) -> new Job(row.getObject("id", UUID.class), JobStatus.valueOf(row.getString("status"))))
            .optional().orElseThrow(() -> new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false));
        boolean exists = jdbc.sql("SELECT EXISTS (SELECT 1 FROM processing_job_result_acknowledgements WHERE job_id = :id)")
            .param("id", job.id()).query(Boolean.class).single();
        if (exists) return;
        if (job.status() != JobStatus.READY) throw new GatewayException(GatewayErrorCode.JOB_STATE_CONFLICT, 409, false);
        enqueue(job.id(), now);
    }

    @Override
    public boolean expire(UUID installationId, UUID jobRef, Instant now, Instant completedBefore) {
        validateCutoff(now, completedBefore);
        var id = jdbc.sql("""
                SELECT j.id FROM processing_jobs j
                LEFT JOIN processing_job_stages s ON s.job_id = j.id
                    AND s.stage = 'RENDERING' AND s.status = 'SUCCEEDED'
                WHERE j.installation_id = :owner AND j.job_ref = :ref AND j.status = 'READY'
                    AND (COALESCE(s.result_expires_at, COALESCE(s.completed_at, j.updated_at) + j.result_retention_seconds * INTERVAL '1 second') <= :now
                        OR COALESCE(s.completed_at, j.updated_at) <= :cutoff)
                FOR UPDATE OF j
                """).param("owner", installationId).param("ref", jobRef)
            .param("cutoff", timestamp(completedBefore)).param("now", timestamp(now)).query(UUID.class).optional();
        if (id.isEmpty()) return false;
        enqueue(id.get(), now);
        return true;
    }

    @Override
    public int expireBatch(int limit, Instant now, Instant completedBefore) {
        validateCutoff(now, completedBefore);
        if (limit < 1 || limit > 100) throw new IllegalArgumentException("Invalid expiration batch");
        return jdbc.sql("""
                WITH expired AS (
                    %s
                ), enqueued AS (
                    INSERT INTO processing_job_result_acknowledgements (job_id, requested_at, next_attempt_at)
                    SELECT id, :now, :now FROM expired ON CONFLICT (job_id) DO NOTHING
                    RETURNING job_id
                )
                UPDATE processing_jobs SET status = 'RESULT_EXPIRED', updated_at = GREATEST(updated_at, :now)
                WHERE id IN (SELECT id FROM expired)
                """.formatted(EXPIRATION_BATCH_CANDIDATES)).param("now", timestamp(now))
            .param("cutoff", timestamp(completedBefore)).param("limit", limit).update();
    }

    private void enqueue(UUID jobId, Instant now) {
        jdbc.sql("""
                INSERT INTO processing_job_result_acknowledgements (job_id, requested_at, next_attempt_at)
                VALUES (:id, :now, :now) ON CONFLICT (job_id) DO NOTHING
                """).param("id", jobId).param("now", timestamp(now)).update();
        jdbc.sql("""
                UPDATE processing_jobs SET status = 'RESULT_EXPIRED', updated_at = GREATEST(updated_at, :now)
                WHERE id = :id
                """).param("id", jobId).param("now", timestamp(now)).update();
    }

    private static void validateCutoff(Instant now, Instant completedBefore) {
        if (now == null || completedBefore == null || completedBefore.isAfter(now)) {
            throw new IllegalArgumentException("Invalid expiration cutoff");
        }
    }

    @Override
    public List<CleanupClaim> claim(int limit, Instant now, Instant leaseUntil) {
        if (limit < 1 || limit > 100 || !leaseUntil.isAfter(now)) throw new IllegalArgumentException("Invalid cleanup claim");
        var ids = jdbc.sql("""
                WITH candidates AS (
                    SELECT job_id FROM processing_job_result_acknowledgements
                    WHERE completed_at IS NULL AND next_attempt_at <= :now
                    ORDER BY next_attempt_at, job_id FOR UPDATE SKIP LOCKED LIMIT :limit
                )
                UPDATE processing_job_result_acknowledgements a SET next_attempt_at = :leaseUntil
                FROM candidates c WHERE a.job_id = c.job_id RETURNING a.job_id
                """).param("now", timestamp(now)).param("leaseUntil", timestamp(leaseUntil)).param("limit", limit)
            .query(UUID.class).list();
        if (ids.isEmpty()) return List.of();
        var keys = new LinkedHashMap<UUID, List<String>>();
        ids.forEach(id -> keys.put(id, new ArrayList<>()));
        jdbc.sql("""
                SELECT id AS job_id, original_object_key AS object_key FROM processing_jobs WHERE id IN (:ids)
                UNION
                SELECT job_id, output_object_key FROM processing_job_stages
                    WHERE job_id IN (:ids) AND output_object_key IS NOT NULL
                UNION
                SELECT job_id, rendered_image_object_key FROM processing_job_stages
                    WHERE job_id IN (:ids) AND rendered_image_object_key IS NOT NULL
                UNION
                SELECT job_id, output_object_key FROM processing_job_layouts
                    WHERE job_id IN (:ids) AND output_object_key IS NOT NULL
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
                UPDATE processing_job_result_acknowledgements SET completed_at = :now
                WHERE job_id = :id AND completed_at IS NULL AND next_attempt_at = :leaseUntil
                """).param("now", timestamp(now)).param("id", jobId).param("leaseUntil", timestamp(leaseUntil)).update() == 1;
    }

    @Override
    public void reschedule(UUID jobId, Instant leaseUntil, Instant nextAttemptAt) {
        jdbc.sql("""
                UPDATE processing_job_result_acknowledgements SET next_attempt_at = :nextAttemptAt
                WHERE job_id = :id AND completed_at IS NULL AND next_attempt_at = :leaseUntil
                """).param("nextAttemptAt", timestamp(nextAttemptAt)).param("id", jobId)
            .param("leaseUntil", timestamp(leaseUntil)).update();
    }

    private static OffsetDateTime timestamp(Instant instant) { return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC); }

    private record Job(UUID id, JobStatus status) { }
}
