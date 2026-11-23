-- Snapshot the accepted original window; configuration changes never renew an accepted job.
-- Legacy retains the historical hard hour from its ORIGINAL creation, not migration time.
-- Non-default legacy disclosures require an audited backfill before any shared deployment.
ALTER TABLE processing_jobs
    ADD COLUMN original_retention_seconds INTEGER NOT NULL DEFAULT 3600,
    ADD CONSTRAINT chk_processing_jobs_original_retention
        CHECK (original_retention_seconds BETWEEN 1 AND 3600);

-- Deadline is derived from created_at + snapshot. Existing creation/PK indexes cover
-- bounded original expiry scans; do not add a duplicate timestamp or redundant index.
