-- Page quality of a rendered result (OK / NEEDS_REVIEW) for ReadyResult, without reading the private manifest.
-- Only the two immutable render facts are stored; status and issues are derived from them in the domain
-- (PageQuality), so no column depends on a non-key determinant. Both are determined by the existing
-- (job_id, stage) PK, read only through it (no new index). Rows rendered before V12 stay NULL: their
-- manifests expire within an hour, so there is nothing to backfill and the API omits quality.
--   rendered_text_region_count  = regions whose translation differs from the source text
--   rendered_text_missing_count = of those, regions left with the original (not rendered)
ALTER TABLE processing_job_stages
    ADD COLUMN rendered_text_region_count INTEGER,
    ADD COLUMN rendered_text_missing_count INTEGER,
    ADD CONSTRAINT chk_rendered_text_counts CHECK (
        (rendered_text_region_count IS NULL AND rendered_text_missing_count IS NULL)
        -- IS NOT NULL is explicit: a CHECK that evaluates to NULL would otherwise pass.
        OR (rendered_text_region_count IS NOT NULL AND rendered_text_missing_count IS NOT NULL
            AND rendered_text_region_count BETWEEN 0 AND 1024
            AND rendered_text_missing_count BETWEEN 0 AND rendered_text_region_count)
    ),
    ADD CONSTRAINT chk_rendered_text_counts_stage CHECK (
        rendered_text_region_count IS NULL OR (stage = 'RENDERING' AND status = 'SUCCEEDED')
    );
