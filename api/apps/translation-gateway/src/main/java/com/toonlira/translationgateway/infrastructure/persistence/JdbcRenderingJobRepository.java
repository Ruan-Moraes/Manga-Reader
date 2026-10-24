package com.toonlira.translationgateway.infrastructure.persistence;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcRenderingJobRepository implements RenderingJobRepository {
    static final String STALE_CLAIM_SQL = """
        SELECT j.id, j.status, j.original_object_key FROM processing_jobs j
        JOIN processing_job_stages s ON s.job_id = j.id AND s.stage = 'RENDERING'
        WHERE j.status IN ('RENDERING', 'CANCEL_PENDING')
            AND s.status = 'RUNNING' AND s.started_at < :cutoff
        ORDER BY s.started_at, j.id LIMIT :limit FOR UPDATE OF j, s SKIP LOCKED
        """;
    private final JdbcClient jdbc;
    private final JdbcOriginalRetention originals;

    public JdbcRenderingJobRepository(JdbcClient jdbc, JdbcOriginalRetention originals) { this.jdbc = jdbc; this.originals = originals; }

    @Override public boolean originalAvailable(UUID jobId, Instant now) { return originals.available(jobId, now); }

    @Override
    public Optional<WorkItem> find(UUID jobRef) {
        return jdbc.sql("""
                SELECT j.id, j.job_ref, j.status, j.original_object_key, j.original_mime_type,
                       j.original_sha256, j.original_byte_size, j.width_px, j.height_px,
                       j.source_language, j.target_language, j.created_at, j.result_retention_seconds,
                       o.output_object_key AS ocr_key, o.output_sha256 AS ocr_hash,
                       t.output_object_key AS translation_key, t.output_sha256 AS translation_hash,
                       r.output_object_key AS manifest_key, r.output_sha256 AS manifest_hash,
                       r.rendered_image_object_key AS image_key, r.rendered_image_sha256 AS image_hash,
                       r.rendered_image_byte_size AS image_bytes, r.result_expires_at
                FROM processing_jobs j
                LEFT JOIN processing_job_stages o ON o.job_id = j.id AND o.stage = 'OCR' AND o.status = 'SUCCEEDED'
                LEFT JOIN processing_job_stages t ON t.job_id = j.id AND t.stage = 'TRANSLATING' AND t.status = 'SUCCEEDED'
                LEFT JOIN processing_job_stages r ON r.job_id = j.id AND r.stage = 'RENDERING'
                WHERE j.job_ref = :jobRef
                """).param("jobRef", jobRef).query((row, ignored) -> {
                var artifacts = row.getString("image_key") == null ? null : new Artifacts(row.getString("image_key"),
                    new RenderedImage("image/webp", row.getLong("image_bytes"), row.getInt("width_px"),
                        row.getInt("height_px"), row.getString("image_hash")), row.getString("manifest_key"),
                    row.getString("manifest_hash"));
                if (artifacts != null && artifacts.resultExpiresAt().isPresent()
                    && !artifacts.resultExpiresAt().orElseThrow().equals(row.getObject("result_expires_at", OffsetDateTime.class).toInstant())) {
                    throw new RenderValidationException(INVALID_OUTPUT);
                }
                return new WorkItem(row.getObject("id", UUID.class), row.getObject("job_ref", UUID.class),
                    JobStatus.valueOf(row.getString("status")), row.getString("original_object_key"),
                    new RenderSource(row.getString("original_mime_type"), row.getLong("original_byte_size"),
                        row.getInt("width_px"), row.getInt("height_px"), row.getString("original_sha256")),
                    row.getString("source_language"), row.getString("target_language"),
                    row.getObject("created_at", OffsetDateTime.class).toInstant(), row.getString("ocr_key"),
                    row.getString("ocr_hash"), row.getString("translation_key"), row.getString("translation_hash"), artifacts,
                    row.getInt("result_retention_seconds"));
            }).optional();
    }

    @Override
    public Claim claim(UUID jobRef, Instant now) {
        var state = jdbc.sql("SELECT id, status FROM processing_jobs WHERE job_ref = :ref FOR UPDATE")
            .param("ref", jobRef).query((row, ignored) -> new State(row.getObject("id", UUID.class),
                JobStatus.valueOf(row.getString("status")))).optional();
        if (state.isEmpty()) return Claim.ALREADY_HANDLED;
        var job = state.orElseThrow();
        if (job.status() == JobStatus.CANCEL_PENDING) {
            if (hasRunningStage(job.id())) return Claim.ALREADY_HANDLED;
            cancel(job.id(), now);
            return Claim.CANCELLED;
        }
        if (job.status() != JobStatus.RENDERING) return Claim.ALREADY_HANDLED;
        if (!originals.available(job.id(), now)) { originals.expire(1, job.id(), now); return Claim.ALREADY_HANDLED; }
        int inserted = jdbc.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at)
                VALUES (:id, 'RENDERING', 'RUNNING', :now)
                ON CONFLICT (job_id, stage) DO NOTHING
                """).param("id", job.id()).param("now", timestamp(now)).update();
        if (inserted == 0) return Claim.ALREADY_HANDLED;
        jdbc.sql("UPDATE processing_jobs SET updated_at = GREATEST(updated_at, :now) WHERE id = :id")
            .param("id", job.id()).param("now", timestamp(now)).update();
        return Claim.STARTED;
    }

    @Override
    public boolean complete(UUID jobId, Artifacts artifacts, Instant now) {
        if (artifacts == null) throw new RenderValidationException(INVALID_OUTPUT);
        var job = lock(jobId);
        if (job == null || !renderingIsRunning(jobId)) return false;
        if (job.status() == JobStatus.CANCEL_PENDING) {
            finishCancellation(jobId, now);
            return false;
        }
        if (job.status() != JobStatus.RENDERING) return false;
        if (!originals.available(jobId, now)) { originals.expire(1, jobId, now); return false; }
        if (artifacts.resultExpiresAt().isEmpty() && job.resultRetentionSeconds() != 3600) {
            throw new RenderValidationException(INVALID_OUTPUT);
        }
        var deadline = artifacts.resultExpiresAt().orElse(now.plusSeconds(job.resultRetentionSeconds()));
        if (!deadline.isAfter(originals.effectiveNow(now)) || deadline.isAfter(now.plusSeconds(job.resultRetentionSeconds()))) {
            throw new RenderValidationException(INVALID_OUTPUT);
        }
        if (artifacts.image().widthPx() != job.widthPx() || artifacts.image().heightPx() != job.heightPx()
            || aliasesInput(artifacts.imageObjectKey(), job) || aliasesInput(artifacts.manifestObjectKey(), job)) {
            throw new RenderValidationException(INVALID_OUTPUT);
        }
        int updated = jdbc.sql("""
                UPDATE processing_job_stages SET status = 'SUCCEEDED', completed_at = :now,
                    output_object_key = :manifestKey, output_sha256 = :manifestHash,
                    rendered_image_object_key = :imageKey, rendered_image_sha256 = :imageHash,
                    rendered_image_byte_size = :imageBytes, result_expires_at = :deadline
                WHERE job_id = :id AND stage = 'RENDERING' AND status = 'RUNNING'
                """).param("id", jobId).param("now", timestamp(now))
            .param("manifestKey", artifacts.manifestObjectKey()).param("manifestHash", artifacts.manifestSha256())
            .param("imageKey", artifacts.imageObjectKey()).param("imageHash", artifacts.image().sha256())
            .param("imageBytes", artifacts.image().byteSize()).param("deadline", timestamp(deadline)).update();
        if (updated != 1) return false;
        jdbc.sql("UPDATE processing_jobs SET status = 'READY', updated_at = GREATEST(updated_at, :now) WHERE id = :id")
            .param("id", jobId).param("now", timestamp(now)).update();
        return true;
    }

    @Override
    public void failUnclaimed(UUID jobId, GatewayErrorCode code, Instant now) {
        var job = lock(jobId);
        if (job == null) return;
        if (job.status() == JobStatus.CANCEL_PENDING) {
            if (!hasRunningStage(jobId)) cancel(jobId, now);
            return;
        }
        if (job.status() != JobStatus.RENDERING) return;
        int inserted = jdbc.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at, completed_at, error_code)
                VALUES (:id, 'RENDERING', 'FAILED', :now, :now, :code)
                ON CONFLICT (job_id, stage) DO NOTHING
                """).param("id", jobId).param("now", timestamp(now)).param("code", code.value()).update();
        if (inserted == 1) failJob(jobId, code, now);
    }

    @Override
    public void fail(UUID jobId, GatewayErrorCode code, Instant now) {
        var job = lock(jobId);
        if (job == null || !renderingIsRunning(jobId)) return;
        if (job.status() == JobStatus.CANCEL_PENDING) {
            finishCancellation(jobId, now);
            return;
        }
        if (job.status() != JobStatus.RENDERING) return;
        jdbc.sql("""
                UPDATE processing_job_stages SET status = 'FAILED', completed_at = :now, error_code = :code
                WHERE job_id = :id AND stage = 'RENDERING' AND status = 'RUNNING'
                """).param("id", jobId).param("now", timestamp(now)).param("code", code.value()).update();
        failJob(jobId, code, now);
    }

    @Override
    public List<String> failStale(Instant cutoff, Instant now, int limit) {
        if (limit < 1 || limit > 100) throw new IllegalArgumentException("Invalid rendering cleanup limit");
        var stale = jdbc.sql(STALE_CLAIM_SQL).param("cutoff", timestamp(cutoff)).param("limit", limit)
            .query((row, ignored) -> new Stale(row.getObject("id", UUID.class),
                JobStatus.valueOf(row.getString("status")), row.getString("original_object_key"))).list();
        for (var job : stale) {
            if (job.status() == JobStatus.CANCEL_PENDING) finishCancellation(job.id(), now);
            else fail(job.id(), GatewayErrorCode.INTERNAL_ERROR, now);
        }
        return stale.stream().map(Stale::originalKey).toList();
    }

    private LockedJob lock(UUID id) {
        return jdbc.sql("""
                SELECT j.status, j.original_object_key, j.width_px, j.height_px, j.result_retention_seconds,
                    o.output_object_key AS ocr_key, t.output_object_key AS translation_key
                FROM processing_jobs j
                LEFT JOIN processing_job_stages o ON o.job_id = j.id AND o.stage = 'OCR'
                LEFT JOIN processing_job_stages t ON t.job_id = j.id AND t.stage = 'TRANSLATING'
                WHERE j.id = :id FOR UPDATE OF j
                """).param("id", id).query((row, ignored) -> new LockedJob(JobStatus.valueOf(row.getString("status")),
                row.getString("original_object_key"), row.getString("ocr_key"), row.getString("translation_key"),
                row.getInt("width_px"), row.getInt("height_px"), row.getInt("result_retention_seconds"))).optional().orElse(null);
    }

    private boolean hasRunningStage(UUID id) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM processing_job_stages WHERE job_id = :id AND status = 'RUNNING')")
            .param("id", id).query(Boolean.class).single();
    }

    private boolean renderingIsRunning(UUID id) {
        return jdbc.sql("""
                SELECT EXISTS (SELECT 1 FROM processing_job_stages
                    WHERE job_id = :id AND stage = 'RENDERING' AND status = 'RUNNING')
                """).param("id", id).query(Boolean.class).single();
    }

    private void finishCancellation(UUID id, Instant now) {
        jdbc.sql("""
                UPDATE processing_job_stages SET status = 'CANCELLED', completed_at = :now
                WHERE job_id = :id AND stage = 'RENDERING' AND status = 'RUNNING'
                """).param("id", id).param("now", timestamp(now)).update();
        cancel(id, now);
    }

    private void cancel(UUID id, Instant now) {
        jdbc.sql("""
                UPDATE processing_jobs SET status = 'CANCELLED', updated_at = GREATEST(updated_at, :now), cancelled_at = :now
                WHERE id = :id AND status = 'CANCEL_PENDING'
                """).param("id", id).param("now", timestamp(now)).update();
    }

    private void failJob(UUID id, GatewayErrorCode code, Instant now) {
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = :code, updated_at = GREATEST(updated_at, :now) WHERE id = :id")
            .param("id", id).param("code", code.value()).param("now", timestamp(now)).update();
    }

    private static boolean aliasesInput(String key, LockedJob job) {
        return key.equals(job.originalKey()) || key.equals(job.ocrKey()) || key.equals(job.translationKey());
    }

    private static OffsetDateTime timestamp(Instant instant) { return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC); }
    private record State(UUID id, JobStatus status) { }
    private record LockedJob(JobStatus status, String originalKey, String ocrKey, String translationKey, int widthPx, int heightPx,
                             int resultRetentionSeconds) { }
    private record Stale(UUID id, JobStatus status, String originalKey) { }
}
