-- A rendering stage owns a final private manifest and a separate WebP image.
-- Its existing (job_id, stage) PK determines all metadata and covers the cascade FK.
-- No OCR text, geometry, duplicate dimensions or redundant indexes are persisted.
ALTER TABLE processing_job_stages
    ADD COLUMN rendered_image_object_key VARCHAR(512),
    ADD COLUMN rendered_image_sha256 CHAR(64),
    ADD COLUMN rendered_image_byte_size BIGINT,
    ADD CONSTRAINT chk_rendered_image_metadata CHECK (
        (rendered_image_object_key IS NULL AND rendered_image_sha256 IS NULL AND rendered_image_byte_size IS NULL)
        OR (rendered_image_object_key IS NOT NULL AND rendered_image_sha256 IS NOT NULL
            AND rendered_image_byte_size IS NOT NULL)
    ),
    ADD CONSTRAINT chk_rendered_image_key CHECK (
        rendered_image_object_key IS NULL OR length(trim(rendered_image_object_key)) > 0
    ),
    ADD CONSTRAINT chk_rendered_image_hash CHECK (
        rendered_image_sha256 IS NULL OR rendered_image_sha256 ~ '^[0-9a-f]{64}$'
    ),
    ADD CONSTRAINT chk_rendered_image_size CHECK (
        rendered_image_byte_size IS NULL OR rendered_image_byte_size BETWEEN 1 AND 67108864
    ),
    ADD CONSTRAINT chk_rendered_image_stage CHECK (
        rendered_image_object_key IS NULL OR (stage = 'RENDERING' AND status = 'SUCCEEDED')
    ),
    ADD CONSTRAINT chk_rendering_output CHECK (
        stage <> 'RENDERING' OR status <> 'SUCCEEDED'
        OR (output_object_key IS NOT NULL AND length(trim(output_object_key)) > 0
            AND output_sha256 IS NOT NULL AND rendered_image_object_key IS NOT NULL
            AND rendered_image_object_key <> output_object_key)
    );
