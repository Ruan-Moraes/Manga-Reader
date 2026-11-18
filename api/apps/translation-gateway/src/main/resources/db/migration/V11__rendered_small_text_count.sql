-- Third immutable text fact of a rendered page, beside V10's counts: of the regions drawn (rendered, not missing),
-- how many came out far smaller than their source lettering. PageQuality derives the TEXT_TOO_SMALL issue from it,
-- so manifest and ReadyResult agree; status and issues stay derived, never stored. Determined by the existing
-- (job_id, stage) PK and read only through it: no new index.
-- Rows rendered before V11 keep NULL here (their results expire within the hour) and report no small text.
--   rendered_text_small_count = drawn regions below the small-text share of their source lettering size
ALTER TABLE processing_job_stages
    ADD COLUMN rendered_text_small_count INTEGER,
    ADD CONSTRAINT chk_rendered_text_small_count CHECK (
        rendered_text_small_count IS NULL
        -- IS NOT NULL is explicit: a CHECK that evaluates to NULL would otherwise pass.
        OR (rendered_text_region_count IS NOT NULL AND rendered_text_missing_count IS NOT NULL
            AND rendered_text_small_count BETWEEN 0 AND rendered_text_region_count - rendered_text_missing_count)
    );
