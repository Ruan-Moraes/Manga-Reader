-- Job policy is immutable at admission. Stage deadline starts before final upload,
-- not at migration or a later config/read. Existing PKs/cascade cover metadata.
-- Legacy non-default policies require audited backfill before shared deployment.
ALTER TABLE processing_jobs
    ADD COLUMN result_retention_seconds INTEGER NOT NULL DEFAULT 3600,
    ADD CONSTRAINT chk_job_result_retention CHECK (result_retention_seconds BETWEEN 1 AND 3600);

ALTER TABLE processing_job_stages ADD COLUMN result_expires_at TIMESTAMPTZ;
UPDATE processing_job_stages SET result_expires_at = completed_at + INTERVAL '1 hour'
    WHERE stage = 'RENDERING' AND status = 'SUCCEEDED';
ALTER TABLE processing_job_stages
    ADD CONSTRAINT chk_rendering_result_deadline CHECK (
        (stage = 'RENDERING' AND status = 'SUCCEEDED' AND completed_at IS NOT NULL
            AND result_expires_at IS NOT NULL AND result_expires_at > completed_at
            AND result_expires_at <= completed_at + INTERVAL '1 hour')
        OR ((stage <> 'RENDERING' OR status <> 'SUCCEEDED') AND result_expires_at IS NULL)
    );
