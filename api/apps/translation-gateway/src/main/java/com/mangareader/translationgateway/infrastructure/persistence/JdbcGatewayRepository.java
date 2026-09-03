package com.mangareader.translationgateway.infrastructure.persistence;

import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.domain.DispatchStatus;
import com.mangareader.translationgateway.domain.GatewayErrorCode;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.domain.Installation;
import com.mangareader.translationgateway.domain.JobStatus;
import com.mangareader.translationgateway.domain.ProcessingJob;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcGatewayRepository implements GatewayRepository {
    private final JdbcClient jdbc;

    public JdbcGatewayRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void createInstallation(UUID id, String credentialHash, Instant now) {
        jdbc.sql("""
                INSERT INTO anonymous_installations (id, credential_hash, status, created_at, last_seen_at)
                VALUES (:id, :hash, 'ACTIVE', :now, :now)
                """)
            .param("id", id).param("hash", credentialHash).param("now", timestamp(now)).update();
    }

    @Override
    public Optional<Installation> findInstallationForUpdate(UUID id) {
        return jdbc.sql("""
                SELECT id, credential_hash, status, created_at
                FROM anonymous_installations WHERE id = :id FOR UPDATE
                """)
            .param("id", id)
            .query((row, ignored) -> new Installation(
                row.getObject("id", UUID.class), row.getString("credential_hash"), row.getString("status"),
                row.getObject("created_at", java.time.OffsetDateTime.class).toInstant()))
            .optional();
    }

    @Override
    public void touchInstallation(UUID id, Instant now) {
        jdbc.sql("UPDATE anonymous_installations SET last_seen_at = :now WHERE id = :id")
            .param("id", id).param("now", timestamp(now)).update();
    }

    @Override
    public void createSession(UUID id, UUID installationId, String tokenHash, Instant createdAt, Instant expiresAt) {
        jdbc.sql("""
                INSERT INTO anonymous_sessions (id, installation_id, token_hash, created_at, expires_at)
                VALUES (:id, :installationId, :tokenHash, :createdAt, :expiresAt)
                """)
            .param("id", id).param("installationId", installationId).param("tokenHash", tokenHash)
            .param("createdAt", timestamp(createdAt)).param("expiresAt", timestamp(expiresAt)).update();
    }

    @Override
    public Optional<UUID> authenticateSession(String tokenHash, Instant now) {
        return jdbc.sql("""
                SELECT s.installation_id
                FROM anonymous_sessions s
                JOIN anonymous_installations i ON i.id = s.installation_id
                WHERE s.token_hash = :tokenHash AND s.revoked_at IS NULL
                  AND s.expires_at > :now AND i.status = 'ACTIVE'
                """)
            .param("tokenHash", tokenHash).param("now", timestamp(now)).query(UUID.class).optional();
    }

    @Override
    public Optional<ProcessingJob> findByIdempotency(UUID installationId, UUID idempotencyKey) {
        return findJob("j.installation_id = :installationId AND j.idempotency_key = :lookup", installationId, idempotencyKey);
    }

    @Override
    public Optional<ProcessingJob> findByJobRef(UUID installationId, UUID jobRef) {
        return findJob("j.installation_id = :installationId AND j.job_ref = :lookup", installationId, jobRef);
    }

    private Optional<ProcessingJob> findJob(String predicate, UUID installationId, UUID lookup) {
        return jdbc.sql("""
                SELECT j.id, j.job_ref, j.installation_id, j.idempotency_key, j.attempt_ref,
                       j.request_fingerprint, j.status, d.status AS dispatch_status, j.error_code, j.updated_at
                FROM processing_jobs j
                JOIN processing_job_dispatches d ON d.job_id = j.id
                WHERE %s
                """.formatted(predicate))
            .param("installationId", installationId).param("lookup", lookup)
            .query((row, ignored) -> mapJob(row)).optional();
    }

    @Override
    public void acquireGlobalQuotaLock(long utcEpochDay) {
        jdbc.sql("SELECT pg_advisory_xact_lock(17017, :epochDay)")
            .param("epochDay", Math.toIntExact(utcEpochDay)).query((row, ignored) -> {
                row.getObject(1);
                return 0;
            }).single();
    }

    @Override
    public long countInstallationJobs(UUID installationId, Instant dayStart, Instant dayEnd) {
        return jdbc.sql("""
                SELECT COUNT(*) FROM processing_jobs
                WHERE installation_id = :installationId AND created_at >= :dayStart AND created_at < :dayEnd
                """)
            .param("installationId", installationId).param("dayStart", timestamp(dayStart)).param("dayEnd", timestamp(dayEnd))
            .query(Long.class).single();
    }

    @Override
    public long countGlobalJobs(Instant dayStart, Instant dayEnd) {
        return jdbc.sql("SELECT COUNT(*) FROM processing_jobs WHERE created_at >= :dayStart AND created_at < :dayEnd")
            .param("dayStart", timestamp(dayStart)).param("dayEnd", timestamp(dayEnd)).query(Long.class).single();
    }

    @Override
    public ProcessingJob insertJob(NewJob job) {
        jdbc.sql("""
                INSERT INTO processing_jobs
                    (id, job_ref, installation_id, idempotency_key, attempt_ref, gateway_contract_version,
                     disclosure_version, source_language, target_language, original_mime_type,
                     original_byte_size, width_px, height_px, status, original_object_key,
                     original_sha256, request_fingerprint, created_at, updated_at, accepted_at, metadata_expires_at)
                VALUES
                    (:id, :jobRef, :installationId, :idempotencyKey, :attemptRef, '1.0',
                     :disclosureVersion, :sourceLanguage, :targetLanguage, :mimeType,
                     :byteSize, :widthPx, :heightPx, 'QUEUED', :objectKey,
                     :originalSha256, :requestFingerprint, :now, :now, :now, :metadataExpiresAt)
                """)
            .param("id", job.id()).param("jobRef", job.jobRef()).param("installationId", job.installationId())
            .param("idempotencyKey", job.idempotencyKey()).param("attemptRef", job.attemptRef())
            .param("disclosureVersion", job.disclosureVersion()).param("sourceLanguage", job.sourceLanguage())
            .param("targetLanguage", job.targetLanguage()).param("mimeType", job.mimeType())
            .param("byteSize", job.byteSize()).param("widthPx", job.widthPx()).param("heightPx", job.heightPx())
            .param("objectKey", job.objectKey()).param("originalSha256", job.originalSha256())
            .param("requestFingerprint", job.requestFingerprint()).param("now", timestamp(job.now()))
            .param("metadataExpiresAt", timestamp(job.metadataExpiresAt())).update();
        jdbc.sql("""
                INSERT INTO processing_job_dispatches (job_id, status, next_attempt_at, created_at, updated_at)
                VALUES (:jobId, 'PENDING', :now, :now, :now)
                """).param("jobId", job.id()).param("now", timestamp(job.now())).update();
        return findByJobRef(job.installationId(), job.jobRef()).orElseThrow();
    }

    @Override
    public ProcessingJob cancel(UUID installationId, UUID jobRef, Instant now) {
        var job = jdbc.sql("""
                SELECT j.id, j.status, d.status AS dispatch_status
                FROM processing_jobs j JOIN processing_job_dispatches d ON d.job_id = j.id
                WHERE j.installation_id = :installationId AND j.job_ref = :jobRef FOR UPDATE OF j, d
                """)
            .param("installationId", installationId).param("jobRef", jobRef)
            .query((row, ignored) -> new CancelRow(row.getObject("id", UUID.class), JobStatus.valueOf(row.getString("status")),
                DispatchStatus.valueOf(row.getString("dispatch_status")))).optional()
            .orElseThrow(() -> new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false));
        var decision = job.status().cancellationDecision(job.dispatchStatus());
        if (decision == JobStatus.CancellationDecision.ALREADY_APPLIED) {
            return findByJobRef(installationId, jobRef).orElseThrow();
        }
        if (decision == JobStatus.CancellationDecision.REJECT) {
            throw new GatewayException(GatewayErrorCode.CANCELLATION_UNAVAILABLE, 409, false);
        }
        if (decision == JobStatus.CancellationDecision.CANCEL_IMMEDIATELY) {
            jdbc.sql("""
                    UPDATE processing_jobs SET status = 'CANCELLED', updated_at = :now,
                        cancellation_requested_at = :now, cancelled_at = :now WHERE id = :id
                    """).param("now", timestamp(now)).param("id", job.id()).update();
            jdbc.sql("UPDATE processing_job_dispatches SET status = 'CANCELLED', updated_at = :now WHERE job_id = :id")
                .param("now", timestamp(now)).param("id", job.id()).update();
        } else {
            jdbc.sql("""
                    UPDATE processing_jobs SET status = 'CANCEL_PENDING', updated_at = :now,
                        cancellation_requested_at = :now WHERE id = :id
                    """).param("now", timestamp(now)).param("id", job.id()).update();
        }
        return findByJobRef(installationId, jobRef).orElseThrow();
    }

    @Override
    public List<DispatchClaim> claimDispatches(int limit, Instant now, Instant leaseUntil) {
        return jdbc.sql("""
                WITH candidates AS (
                    SELECT d.job_id FROM processing_job_dispatches d
                    WHERE d.status = 'PENDING' AND d.next_attempt_at <= :now
                    ORDER BY d.next_attempt_at, d.job_id
                    FOR UPDATE SKIP LOCKED LIMIT :limit
                )
                UPDATE processing_job_dispatches d
                SET attempt_count = d.attempt_count + 1, next_attempt_at = :leaseUntil, updated_at = :now
                FROM candidates c, processing_jobs j
                WHERE d.job_id = c.job_id AND j.id = d.job_id
                RETURNING d.job_id, j.job_ref, d.attempt_count
                """).param("now", timestamp(now)).param("leaseUntil", timestamp(leaseUntil)).param("limit", limit)
            .query((row, ignored) -> new DispatchClaim(row.getObject("job_id", UUID.class),
                row.getObject("job_ref", UUID.class), row.getInt("attempt_count"))).list();
    }

    @Override
    public void markDispatched(UUID jobId, Instant now) {
        jdbc.sql("""
                UPDATE processing_job_dispatches SET status = 'DISPATCHED', updated_at = :now,
                    dispatched_at = :now, last_error_code = NULL WHERE job_id = :jobId AND status = 'PENDING'
                """).param("now", timestamp(now)).param("jobId", jobId).update();
    }

    @Override
    public void rescheduleDispatch(UUID jobId, Instant nextAttemptAt, String errorCode, boolean exhausted, Instant now) {
        if (exhausted) {
            jdbc.sql("""
                    UPDATE processing_job_dispatches SET status = 'FAILED', updated_at = :now,
                        last_error_code = :errorCode WHERE job_id = :jobId AND status = 'PENDING'
                    """).param("now", timestamp(now)).param("errorCode", errorCode).param("jobId", jobId).update();
            jdbc.sql("""
                    UPDATE processing_jobs SET status = 'FAILED', error_code = :errorCode, updated_at = :now
                    WHERE id = :jobId AND status = 'QUEUED'
                    """).param("now", timestamp(now)).param("errorCode", GatewayErrorCode.DISPATCH_UNAVAILABLE.value())
                .param("jobId", jobId).update();
            return;
        }
        jdbc.sql("""
                UPDATE processing_job_dispatches SET next_attempt_at = :nextAttemptAt,
                    updated_at = :now, last_error_code = :errorCode WHERE job_id = :jobId AND status = 'PENDING'
                """).param("nextAttemptAt", timestamp(nextAttemptAt)).param("now", timestamp(now)).param("errorCode", errorCode)
            .param("jobId", jobId).update();
    }

    @Override
    public int deleteExpiredSessions(Instant now) {
        return jdbc.sql("DELETE FROM anonymous_sessions WHERE expires_at <= :now OR revoked_at IS NOT NULL")
            .param("now", timestamp(now)).update();
    }

    @Override
    public int deleteExpiredMetadata(Instant now) {
        return jdbc.sql("DELETE FROM processing_jobs WHERE metadata_expires_at <= :now")
            .param("now", timestamp(now)).update();
    }

    private ProcessingJob mapJob(java.sql.ResultSet row) throws java.sql.SQLException {
        return new ProcessingJob(row.getObject("id", UUID.class), row.getObject("job_ref", UUID.class),
            row.getObject("installation_id", UUID.class), row.getObject("idempotency_key", UUID.class),
            row.getObject("attempt_ref", UUID.class), row.getString("request_fingerprint"),
            JobStatus.valueOf(row.getString("status")), DispatchStatus.valueOf(row.getString("dispatch_status")),
            row.getString("error_code"), row.getObject("updated_at", java.time.OffsetDateTime.class).toInstant());
    }

    private OffsetDateTime timestamp(Instant value) {
        return OffsetDateTime.ofInstant(value, ZoneOffset.UTC);
    }

    private record CancelRow(UUID id, JobStatus status, DispatchStatus dispatchStatus) { }
}
