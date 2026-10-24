package com.toonlira.translationgateway.infrastructure.persistence;

import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcTranslationJobRepository implements TranslationJobRepository {
    private final JdbcClient jdbc;
    private final JdbcOriginalRetention originals;

    public JdbcTranslationJobRepository(JdbcClient jdbc, JdbcOriginalRetention originals) { this.jdbc = jdbc; this.originals = originals; }

    @Override public boolean originalAvailable(UUID jobId, Instant now) { return originals.available(jobId, now); }

    @Override
    public Optional<WorkItem> find(UUID jobRef) {
        return jdbc.sql("""
                SELECT j.id, j.job_ref, j.status, j.source_language, j.target_language,
                       o.output_object_key AS ocr_key, o.output_sha256 AS ocr_hash,
                       t.output_object_key AS translation_key, t.output_sha256 AS translation_hash
                FROM processing_jobs j
                LEFT JOIN processing_job_stages o ON o.job_id = j.id AND o.stage = 'OCR' AND o.status = 'SUCCEEDED'
                LEFT JOIN processing_job_stages t ON t.job_id = j.id AND t.stage = 'TRANSLATING'
                WHERE j.job_ref = :jobRef
                """).param("jobRef", jobRef).query((row, ignored) -> new WorkItem(
                    row.getObject("id", UUID.class), row.getObject("job_ref", UUID.class),
                    JobStatus.valueOf(row.getString("status")), row.getString("source_language"),
                    row.getString("target_language"), row.getString("ocr_key"), row.getString("ocr_hash"),
                    row.getString("translation_key"), row.getString("translation_hash"))).optional();
    }

    @Override
    public Claim claim(UUID jobRef, Instant now) {
        var state = jdbc.sql("SELECT id, status FROM processing_jobs WHERE job_ref = :jobRef FOR UPDATE")
            .param("jobRef", jobRef).query((row, ignored) -> new State(
                row.getObject("id", UUID.class), JobStatus.valueOf(row.getString("status")))).optional();
        if (state.isEmpty()) return Claim.ALREADY_HANDLED;
        var job = state.orElseThrow();
        if (job.status() == JobStatus.CANCEL_PENDING) {
            if (hasRunningStage(job.id())) return Claim.ALREADY_HANDLED;
            cancel(job.id(), now);
            return Claim.CANCELLED;
        }
        if (job.status() != JobStatus.TRANSLATING) return Claim.ALREADY_HANDLED;
        if (!originals.available(job.id(), now)) { originals.expire(1, job.id(), now); return Claim.ALREADY_HANDLED; }
        int inserted = jdbc.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at)
                VALUES (:id, 'TRANSLATING', 'RUNNING', :now)
                ON CONFLICT (job_id, stage) DO NOTHING
                """).param("id", job.id()).param("now", timestamp(now)).update();
        return inserted == 1 ? Claim.STARTED : Claim.ALREADY_HANDLED;
    }

    @Override
    public boolean complete(UUID jobId, String objectKey, String sha256, Instant now) {
        var status = lockStatus(jobId);
        if (status == JobStatus.CANCEL_PENDING) {
            jdbc.sql("""
                    UPDATE processing_job_stages SET status = 'CANCELLED', completed_at = :now
                    WHERE job_id = :id AND stage = 'TRANSLATING' AND status = 'RUNNING'
                    """).param("id", jobId).param("now", timestamp(now)).update();
            if (!hasRunningStage(jobId)) cancel(jobId, now);
            return false;
        }
        if (status != JobStatus.TRANSLATING) return false;
        if (!originals.available(jobId, now)) { originals.expire(1, jobId, now); return false; }
        int updated = jdbc.sql("""
                UPDATE processing_job_stages
                SET status = 'SUCCEEDED', completed_at = :now, output_object_key = :key, output_sha256 = :hash
                WHERE job_id = :id AND stage = 'TRANSLATING' AND status = 'RUNNING'
                """).param("id", jobId).param("key", objectKey).param("hash", sha256)
            .param("now", timestamp(now)).update();
        if (updated != 1) return false;
        jdbc.sql("UPDATE processing_jobs SET status = 'RENDERING', updated_at = :now WHERE id = :id")
            .param("id", jobId).param("now", timestamp(now)).update();
        return true;
    }

    @Override
    public void failUnclaimed(UUID jobId, GatewayErrorCode code, Instant now) {
        var status = lockStatus(jobId);
        if (status == JobStatus.CANCEL_PENDING) {
            if (!hasRunningStage(jobId)) cancel(jobId, now);
            return;
        }
        if (status != JobStatus.TRANSLATING) return;
        // The job lock serializes this decision with claim/complete/cancel. A
        // conflicting stage belongs to another delivery and must remain intact.
        int inserted = jdbc.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at, completed_at, error_code)
                VALUES (:id, 'TRANSLATING', 'FAILED', :now, :now, :code)
                ON CONFLICT (job_id, stage) DO NOTHING
                """).param("id", jobId).param("now", timestamp(now)).param("code", code.value()).update();
        if (inserted == 1) {
            jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = :code, updated_at = :now WHERE id = :id")
                .param("id", jobId).param("now", timestamp(now)).param("code", code.value()).update();
        }
    }

    @Override
    public void fail(UUID jobId, GatewayErrorCode code, Instant now) {
        var status = lockStatus(jobId);
        if (status == JobStatus.CANCEL_PENDING) {
            jdbc.sql("""
                    UPDATE processing_job_stages SET status = 'CANCELLED', completed_at = :now
                    WHERE job_id = :id AND stage = 'TRANSLATING' AND status = 'RUNNING'
                    """).param("id", jobId).param("now", timestamp(now)).update();
            if (!hasRunningStage(jobId)) cancel(jobId, now);
            return;
        }
        if (status != JobStatus.TRANSLATING) return;
        jdbc.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at, completed_at, error_code)
                VALUES (:id, 'TRANSLATING', 'FAILED', :now, :now, :code)
                ON CONFLICT (job_id, stage) DO UPDATE SET status = 'FAILED', completed_at = :now,
                    error_code = :code WHERE processing_job_stages.status = 'RUNNING'
                """).param("id", jobId).param("now", timestamp(now)).param("code", code.value()).update();
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = :code, updated_at = :now WHERE id = :id")
            .param("id", jobId).param("now", timestamp(now)).param("code", code.value()).update();
    }

    @Override
    public int failStale(Instant cutoff, Instant now, int limit) {
        var stale = jdbc.sql("""
                SELECT j.id, j.status FROM processing_job_stages s
                JOIN processing_jobs j ON j.id = s.job_id
                WHERE s.stage = 'TRANSLATING' AND s.status = 'RUNNING' AND s.started_at < :cutoff
                  AND j.status IN ('TRANSLATING', 'CANCEL_PENDING')
                ORDER BY s.started_at, j.id LIMIT :limit FOR UPDATE OF j, s SKIP LOCKED
                """).param("cutoff", timestamp(cutoff)).param("limit", limit)
            .query((row, ignored) -> new State(row.getObject("id", UUID.class),
                JobStatus.valueOf(row.getString("status")))).list();
        for (var job : stale) {
            if (job.status() == JobStatus.CANCEL_PENDING) {
                jdbc.sql("""
                    UPDATE processing_job_stages SET status = 'CANCELLED', completed_at = :now
                    WHERE job_id = :id AND stage = 'TRANSLATING'
                    """).param("id", job.id()).param("now", timestamp(now)).update();
                cancel(job.id(), now);
            } else {
                jdbc.sql("""
                    UPDATE processing_job_stages SET status = 'FAILED', completed_at = :now, error_code = :code
                    WHERE job_id = :id AND stage = 'TRANSLATING'
                    """).param("id", job.id()).param("now", timestamp(now))
                    .param("code", GatewayErrorCode.TRANSLATION_UNAVAILABLE.value()).update();
                jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = :code, updated_at = :now WHERE id = :id")
                    .param("id", job.id()).param("now", timestamp(now))
                    .param("code", GatewayErrorCode.TRANSLATION_UNAVAILABLE.value()).update();
            }
        }
        return stale.size();
    }

    private JobStatus lockStatus(UUID jobId) {
        return jdbc.sql("SELECT status FROM processing_jobs WHERE id = :id FOR UPDATE")
            .param("id", jobId).query(String.class).optional().map(JobStatus::valueOf).orElse(null);
    }

    private boolean hasRunningStage(UUID jobId) {
        return jdbc.sql("""
                SELECT EXISTS (SELECT 1 FROM processing_job_stages
                    WHERE job_id = :id AND status = 'RUNNING')
                """).param("id", jobId).query(Boolean.class).single();
    }

    private void cancel(UUID jobId, Instant now) {
        jdbc.sql("""
                UPDATE processing_jobs SET status = 'CANCELLED', updated_at = :now, cancelled_at = :now
                WHERE id = :id AND status = 'CANCEL_PENDING'
                """).param("id", jobId).param("now", timestamp(now)).update();
    }

    private static OffsetDateTime timestamp(Instant instant) { return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC); }
    private record State(UUID id, JobStatus status) { }
}
