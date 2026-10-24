package com.toonlira.translationgateway.infrastructure.persistence;

import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.layout.LayoutOutcome;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcOcrJobRepository implements OcrJobRepository {
    private final JdbcClient jdbc;
    private final JdbcOriginalRetention originals;

    public JdbcOcrJobRepository(JdbcClient jdbc, JdbcOriginalRetention originals) { this.jdbc = jdbc; this.originals = originals; }

    @Override public boolean originalAvailable(UUID jobId, Instant now) { return originals.available(jobId, now); }

    @Override
    public Optional<WorkItem> find(UUID jobRef) {
        return jdbc.sql("""
                SELECT id, job_ref, status, original_object_key, original_sha256, original_mime_type,
                       original_byte_size, width_px, height_px, source_language
                FROM processing_jobs WHERE job_ref = :jobRef
                """).param("jobRef", jobRef).query((row, ignored) -> new WorkItem(
                    row.getObject("id", UUID.class), row.getObject("job_ref", UUID.class),
                    JobStatus.valueOf(row.getString("status")), row.getString("original_object_key"),
                    row.getString("original_sha256"), row.getString("original_mime_type"),
                    row.getLong("original_byte_size"), row.getInt("width_px"), row.getInt("height_px"),
                    row.getString("source_language"))).optional();
    }

    @Override
    public Optional<OutputArtifact> findOutput(UUID jobId) {
        return jdbc.sql("""
                SELECT output_object_key, output_sha256 FROM processing_job_stages
                WHERE job_id = :id AND stage = 'OCR' AND status = 'SUCCEEDED'
                """).param("id", jobId).query((row, ignored) -> new OutputArtifact(
                    row.getString("output_object_key"), row.getString("output_sha256"))).optional();
    }

    @Override
    public void failUnclaimed(UUID jobId, GatewayErrorCode errorCode, Instant now) {
        var status = lockStatus(jobId);
        if (status == JobStatus.CANCEL_PENDING) {
            if (!hasRunningStage(jobId)) cancel(jobId, now);
            return;
        }
        if (status != JobStatus.QUEUED) return;
        int inserted = jdbc.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at, completed_at, error_code)
                VALUES (:id, 'OCR', 'FAILED', :now, :now, :code) ON CONFLICT (job_id, stage) DO NOTHING
                """).param("id", jobId).param("now", timestamp(now)).param("code", errorCode.value()).update();
        if (inserted == 1) failJob(jobId, errorCode, now);
    }

    @Override
    public Claim claim(UUID jobRef, Instant now) {
        var row = jdbc.sql("SELECT id, status FROM processing_jobs WHERE job_ref = :jobRef FOR UPDATE")
            .param("jobRef", jobRef)
            .query((result, ignored) -> new State(result.getObject("id", UUID.class),
                JobStatus.valueOf(result.getString("status")))).optional();
        if (row.isEmpty()) return Claim.ALREADY_HANDLED;
        var job = row.orElseThrow();
        if (job.status() == JobStatus.CANCEL_PENDING) {
            if (hasRunningStage(job.id())) return Claim.ALREADY_HANDLED;
            cancel(job.id(), now);
            return Claim.CANCELLED;
        }
        if (job.status() != JobStatus.QUEUED) return Claim.ALREADY_HANDLED;
        if (!originals.available(job.id(), now)) { originals.expire(1, job.id(), now); return Claim.ALREADY_HANDLED; }
        jdbc.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at)
                VALUES (:id, 'OCR', 'RUNNING', :now)
                """).param("id", job.id()).param("now", timestamp(now)).update();
        jdbc.sql("UPDATE processing_jobs SET status = 'OCR', updated_at = :now WHERE id = :id")
            .param("id", job.id()).param("now", timestamp(now)).update();
        return Claim.STARTED;
    }

    @Override
    public boolean complete(UUID jobId, String objectKey, String sha256, Instant now) {
        var status = lockStatus(jobId);
        if (status == JobStatus.CANCEL_PENDING) {
            jdbc.sql("""
                    UPDATE processing_job_stages SET status = 'CANCELLED', completed_at = :now
                    WHERE job_id = :id AND stage = 'OCR' AND status = 'RUNNING'
                    """).param("id", jobId).param("now", timestamp(now)).update();
            if (!hasRunningStage(jobId)) cancel(jobId, now);
            return false;
        }
        if (status != JobStatus.OCR) return false;
        if (!originals.available(jobId, now)) { originals.expire(1, jobId, now); return false; }
        int updated = jdbc.sql("""
                UPDATE processing_job_stages
                SET status = 'SUCCEEDED', completed_at = :now, output_object_key = :objectKey,
                    output_sha256 = :sha256
                WHERE job_id = :id AND stage = 'OCR' AND status = 'RUNNING'
                """).param("now", timestamp(now)).param("objectKey", objectKey)
            .param("sha256", sha256).param("id", jobId).update();
        if (updated != 1) return false;
        jdbc.sql("UPDATE processing_jobs SET status = 'TRANSLATING', updated_at = :now WHERE id = :id")
            .param("now", timestamp(now)).param("id", jobId).update();
        return true;
    }

    @Override
    public boolean completeWithLayout(UUID jobId, String objectKey, String sha256, Instant now, LayoutOutcome layout) {
        if (!complete(jobId, objectKey, sha256, now)) return false;
        if (layout != null) jdbc.sql("""
            INSERT INTO processing_job_layouts
                (job_id, stage, status, output_object_key, output_sha256, error_code, started_at, completed_at)
            VALUES (:id, 'OCR', :status, :key, :hash, :error, :started, :completed)
            """).param("id", jobId).param("status", layout.status().name())
            .param("key", layout.objectKey()).param("hash", layout.sha256()).param("error", layout.errorCode())
            .param("started", timestamp(layout.startedAt())).param("completed", timestamp(layout.completedAt())).update();
        return true;
    }

    @Override
    public void fail(UUID jobId, GatewayErrorCode errorCode, Instant now) {
        var status = lockStatus(jobId);
        if (status == JobStatus.CANCEL_PENDING) {
            jdbc.sql("""
                    UPDATE processing_job_stages SET status = 'CANCELLED', completed_at = :now
                    WHERE job_id = :id AND stage = 'OCR' AND status = 'RUNNING'
                    """).param("id", jobId).param("now", timestamp(now)).update();
            if (!hasRunningStage(jobId)) cancel(jobId, now);
            return;
        }
        if (status != JobStatus.OCR) return;
        int updated = jdbc.sql("""
                UPDATE processing_job_stages SET status = 'FAILED', completed_at = :now, error_code = :code
                WHERE job_id = :id AND stage = 'OCR' AND status = 'RUNNING'
                """).param("id", jobId).param("now", timestamp(now)).param("code", errorCode.value()).update();
        if (updated == 1) failJob(jobId, errorCode, now);
    }

    private void failJob(UUID jobId, GatewayErrorCode errorCode, Instant now) {
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = :code, updated_at = :now WHERE id = :id")
            .param("code", errorCode.value()).param("now", timestamp(now)).param("id", jobId).update();
    }

    @Override
    public List<String> failStale(Instant cutoff, Instant now, int limit) {
        var stale = jdbc.sql("""
                SELECT j.id, j.status, j.original_object_key
                FROM processing_job_stages s JOIN processing_jobs j ON j.id = s.job_id
                WHERE s.stage = 'OCR' AND s.status = 'RUNNING' AND s.started_at < :cutoff
                  AND j.status IN ('OCR', 'CANCEL_PENDING')
                ORDER BY s.started_at, j.id LIMIT :limit FOR UPDATE OF j, s SKIP LOCKED
                """).param("cutoff", timestamp(cutoff)).param("limit", limit)
            .query((row, ignored) -> new Stale(row.getObject("id", UUID.class),
                JobStatus.valueOf(row.getString("status")), row.getString("original_object_key"))).list();
        for (var job : stale) {
            if (job.status() == JobStatus.CANCEL_PENDING) {
                jdbc.sql("""
                        UPDATE processing_job_stages SET status = 'CANCELLED', completed_at = :now
                        WHERE job_id = :id AND stage = 'OCR'
                        """).param("id", job.id()).param("now", timestamp(now)).update();
                cancel(job.id(), now);
            } else {
                jdbc.sql("""
                        UPDATE processing_job_stages SET status = 'FAILED', completed_at = :now, error_code = :code
                        WHERE job_id = :id AND stage = 'OCR'
                        """).param("id", job.id()).param("now", timestamp(now))
                    .param("code", GatewayErrorCode.OCR_UNAVAILABLE.value()).update();
                jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = :code, updated_at = :now WHERE id = :id")
                    .param("id", job.id()).param("now", timestamp(now))
                    .param("code", GatewayErrorCode.OCR_UNAVAILABLE.value()).update();
            }
        }
        return stale.stream().map(Stale::objectKey).toList();
    }

    private JobStatus lockStatus(UUID jobId) {
        return jdbc.sql("SELECT status FROM processing_jobs WHERE id = :id FOR UPDATE")
            .param("id", jobId).query(String.class).optional().map(JobStatus::valueOf).orElse(null);
    }

    private boolean hasRunningStage(UUID jobId) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM processing_job_stages WHERE job_id = :id AND status = 'RUNNING')")
            .param("id", jobId).query(Boolean.class).single();
    }

    private void cancel(UUID jobId, Instant now) {
        jdbc.sql("""
                UPDATE processing_jobs SET status = 'CANCELLED', updated_at = :now,
                    cancelled_at = :now WHERE id = :id AND status = 'CANCEL_PENDING'
                """).param("id", jobId).param("now", timestamp(now)).update();
    }

    private OffsetDateTime timestamp(Instant instant) { return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC); }
    private record State(UUID id, JobStatus status) { }
    private record Stale(UUID id, JobStatus status, String objectKey) { }
}
