-- Separate original/terminal cleanup from ACK: original deletion never acknowledges download.
CREATE TABLE processing_job_lifecycle_cleanups (
    job_id UUID PRIMARY KEY,
    cleanup_scope VARCHAR(16) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL,
    next_attempt_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT fk_lifecycle_cleanups_job
        FOREIGN KEY (job_id) REFERENCES processing_jobs(id) ON DELETE CASCADE,
    CONSTRAINT chk_lifecycle_cleanups_scope CHECK (cleanup_scope IN ('ORIGINAL', 'ALL')),
    CONSTRAINT chk_lifecycle_cleanups_timestamps CHECK (
        next_attempt_at >= requested_at
        AND (completed_at IS NULL OR completed_at >= requested_at)
    )
);

-- Bounded due claims; the PK already covers the job FK and idempotent insertion.
CREATE INDEX idx_lifecycle_cleanups_pending
    ON processing_job_lifecycle_cleanups (next_attempt_at, job_id)
    WHERE completed_at IS NULL;
