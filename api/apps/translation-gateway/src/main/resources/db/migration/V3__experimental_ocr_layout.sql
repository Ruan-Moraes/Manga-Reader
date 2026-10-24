-- One optional experimental result per OCR stage. No text or geometry in PostgreSQL.
-- job_id determines all attributes; its PK also covers lookup and the composite FK cascade.
CREATE TABLE processing_job_layouts (
    job_id UUID PRIMARY KEY,
    stage VARCHAR(32) NOT NULL DEFAULT 'OCR' CHECK (stage = 'OCR'),
    status VARCHAR(16) NOT NULL CHECK (status IN ('SUCCEEDED', 'FAILED')),
    output_object_key VARCHAR(512),
    output_sha256 CHAR(64),
    error_code VARCHAR(64),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_layout_ocr_stage FOREIGN KEY (job_id, stage)
        REFERENCES processing_job_stages (job_id, stage) ON DELETE CASCADE,
    CONSTRAINT chk_layout_time CHECK (completed_at >= started_at),
    CONSTRAINT chk_layout_hash CHECK (output_sha256 IS NULL OR output_sha256 ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_layout_result CHECK (
        (status = 'SUCCEEDED' AND output_object_key IS NOT NULL AND length(trim(output_object_key)) > 0
            AND output_sha256 IS NOT NULL AND error_code IS NULL)
        OR (status = 'FAILED' AND output_object_key IS NULL AND output_sha256 IS NULL
            AND error_code IS NOT NULL AND error_code IN
                ('layout-unavailable', 'layout-timeout', 'layout-invalid-response', 'layout-limit-exceeded'))
    )
);
