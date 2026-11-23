-- One durable ACK per job; no content or duplicate object metadata is persisted.
CREATE TABLE processing_job_result_acknowledgements (
    job_id UUID PRIMARY KEY,
    requested_at TIMESTAMPTZ NOT NULL,
    next_attempt_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT fk_result_acknowledgements_job
        FOREIGN KEY (job_id) REFERENCES processing_jobs(id) ON DELETE CASCADE,
    CONSTRAINT chk_result_acknowledgements_timestamps CHECK (
        next_attempt_at >= requested_at
        AND (completed_at IS NULL OR completed_at >= requested_at)
    )
);

-- Covers bounded pending cleanup claims; the PK already indexes the job FK.
CREATE INDEX idx_result_acknowledgements_pending
    ON processing_job_result_acknowledgements (next_attempt_at, job_id)
    WHERE completed_at IS NULL;
