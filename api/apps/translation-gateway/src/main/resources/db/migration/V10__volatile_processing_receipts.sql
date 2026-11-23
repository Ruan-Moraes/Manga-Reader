-- Receipts contain operational metadata only. Content is never resumable from this table.
CREATE TABLE volatile_processing_attempts (
    operation_ref uuid PRIMARY KEY,
    installation_id uuid NOT NULL REFERENCES anonymous_installations(id) ON DELETE CASCADE,
    idempotency_key uuid NOT NULL CHECK (substring(idempotency_key::text,15,1)='7'
        AND substring(idempotency_key::text,20,1) IN ('8','9','a','b')),
    status varchar(16) NOT NULL CHECK (status IN ('STARTED', 'FINISHED', 'FAILED')),
    created_at timestamptz NOT NULL,
    finished_at timestamptz,
    error_code varchar(64),
    UNIQUE (installation_id, idempotency_key),
    CHECK ((status = 'STARTED' AND finished_at IS NULL AND error_code IS NULL)
        OR (status = 'FINISHED' AND finished_at IS NOT NULL AND finished_at >= created_at AND error_code IS NULL)
        OR (status = 'FAILED' AND finished_at IS NOT NULL AND finished_at >= created_at AND error_code IS NOT NULL)),
    CHECK (error_code IS NULL OR error_code IN (
        'internal-error', 'ocr-unavailable', 'ocr-invalid-response',
        'translation-unavailable', 'translation-invalid-request', 'translation-invalid-response'
    ))
);

-- Global daily quota and operational metadata expiry. Owner lookup is covered by UNIQUE.
CREATE INDEX idx_volatile_processing_attempts_created_at ON volatile_processing_attempts(created_at);
