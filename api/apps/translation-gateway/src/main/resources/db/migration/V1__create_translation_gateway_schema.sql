CREATE TABLE anonymous_installations (
    id uuid PRIMARY KEY,
    credential_hash varchar(255) NOT NULL,
    status varchar(16) NOT NULL,
    created_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,
    revoked_at timestamptz,
    CONSTRAINT uk_anonymous_installations_credential_hash UNIQUE (credential_hash),
    CONSTRAINT chk_anonymous_installations_status
        CHECK (status IN ('ACTIVE', 'REVOKED')),
    CONSTRAINT chk_anonymous_installations_timestamps
        CHECK (last_seen_at >= created_at AND (revoked_at IS NULL OR revoked_at >= created_at)),
    CONSTRAINT chk_anonymous_installations_revocation
        CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR (status = 'REVOKED' AND revoked_at IS NOT NULL))
);

CREATE TABLE anonymous_sessions (
    id uuid PRIMARY KEY,
    installation_id uuid NOT NULL,
    token_hash char(64) NOT NULL,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    CONSTRAINT fk_anonymous_sessions_installation
        FOREIGN KEY (installation_id) REFERENCES anonymous_installations(id) ON DELETE CASCADE,
    CONSTRAINT uk_anonymous_sessions_token_hash UNIQUE (token_hash),
    CONSTRAINT chk_anonymous_sessions_token_hash
        CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_anonymous_sessions_timestamps
        CHECK (expires_at > created_at AND (revoked_at IS NULL OR revoked_at BETWEEN created_at AND expires_at))
);

CREATE INDEX idx_anonymous_sessions_installation_expiry
    ON anonymous_sessions (installation_id, expires_at);

CREATE INDEX idx_anonymous_sessions_expired
    ON anonymous_sessions (expires_at, id)
    WHERE revoked_at IS NULL;

CREATE TABLE processing_jobs (
    id uuid PRIMARY KEY,
    job_ref uuid NOT NULL,
    installation_id uuid NOT NULL,
    idempotency_key uuid NOT NULL,
    attempt_ref uuid NOT NULL,
    gateway_contract_version varchar(16) NOT NULL,
    disclosure_version varchar(64) NOT NULL,
    source_language varchar(16) NOT NULL,
    target_language varchar(16) NOT NULL,
    original_mime_type varchar(32) NOT NULL,
    original_byte_size bigint NOT NULL,
    width_px integer NOT NULL,
    height_px integer NOT NULL,
    status varchar(24) NOT NULL,
    original_object_key varchar(512) NOT NULL,
    original_sha256 char(64) NOT NULL,
    request_fingerprint char(64) NOT NULL,
    error_code varchar(64),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    accepted_at timestamptz NOT NULL,
    cancellation_requested_at timestamptz,
    cancelled_at timestamptz,
    metadata_expires_at timestamptz NOT NULL,
    CONSTRAINT fk_processing_jobs_installation
        FOREIGN KEY (installation_id) REFERENCES anonymous_installations(id) ON DELETE CASCADE,
    CONSTRAINT uk_processing_jobs_job_ref UNIQUE (job_ref),
    CONSTRAINT uk_processing_jobs_installation_idempotency UNIQUE (installation_id, idempotency_key),
    CONSTRAINT uk_processing_jobs_installation_attempt UNIQUE (installation_id, attempt_ref),
    CONSTRAINT chk_processing_jobs_contract_version
        CHECK (gateway_contract_version = '1.0'),
    CONSTRAINT chk_processing_jobs_language
        CHECK (
            source_language IN ('ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR')
            AND target_language IN ('ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR')
            AND source_language <> target_language
        ),
    CONSTRAINT chk_processing_jobs_media
        CHECK (
            original_mime_type IN ('image/jpeg', 'image/png', 'image/webp')
            AND original_byte_size > 0
            AND width_px > 0
            AND height_px > 0
        ),
    CONSTRAINT chk_processing_jobs_hashes
        CHECK (original_sha256 ~ '^[0-9a-f]{64}$' AND request_fingerprint ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_processing_jobs_status
        CHECK (status IN ('QUEUED', 'OCR', 'TRANSLATING', 'RENDERING', 'READY', 'FAILED', 'CANCEL_PENDING', 'CANCELLED', 'RESULT_EXPIRED')),
    CONSTRAINT chk_processing_jobs_error
        CHECK ((status = 'FAILED' AND error_code IS NOT NULL) OR (status <> 'FAILED' AND error_code IS NULL)),
    CONSTRAINT chk_processing_jobs_cancellation
        CHECK (
            (status NOT IN ('CANCEL_PENDING', 'CANCELLED') AND cancellation_requested_at IS NULL AND cancelled_at IS NULL)
            OR (status = 'CANCEL_PENDING' AND cancellation_requested_at IS NOT NULL AND cancelled_at IS NULL)
            OR (status = 'CANCELLED' AND cancellation_requested_at IS NOT NULL AND cancelled_at IS NOT NULL)
        ),
    CONSTRAINT chk_processing_jobs_timestamps
        CHECK (
            updated_at >= created_at
            AND accepted_at BETWEEN created_at AND updated_at
            AND (cancellation_requested_at IS NULL OR cancellation_requested_at BETWEEN accepted_at AND updated_at)
            AND (cancelled_at IS NULL OR cancelled_at BETWEEN cancellation_requested_at AND updated_at)
            AND metadata_expires_at > created_at
        )
);

CREATE INDEX idx_processing_jobs_installation_created
    ON processing_jobs (installation_id, created_at DESC);

CREATE INDEX idx_processing_jobs_created
    ON processing_jobs (created_at DESC, id);

CREATE INDEX idx_processing_jobs_non_terminal
    ON processing_jobs (updated_at, id)
    WHERE status IN ('QUEUED', 'OCR', 'TRANSLATING', 'RENDERING', 'CANCEL_PENDING');

CREATE TABLE processing_job_stages (
    job_id uuid NOT NULL,
    stage varchar(24) NOT NULL,
    status varchar(16) NOT NULL,
    started_at timestamptz,
    completed_at timestamptz,
    error_code varchar(64),
    billable_unit varchar(64),
    PRIMARY KEY (job_id, stage),
    CONSTRAINT fk_processing_job_stages_job
        FOREIGN KEY (job_id) REFERENCES processing_jobs(id) ON DELETE CASCADE,
    CONSTRAINT chk_processing_job_stages_stage
        CHECK (stage IN ('QUEUED', 'OCR', 'TRANSLATING', 'RENDERING')),
    CONSTRAINT chk_processing_job_stages_status
        CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    CONSTRAINT chk_processing_job_stages_error
        CHECK ((status = 'FAILED' AND error_code IS NOT NULL) OR (status <> 'FAILED' AND error_code IS NULL)),
    CONSTRAINT chk_processing_job_stages_timestamps
        CHECK (
            (status = 'PENDING' AND started_at IS NULL AND completed_at IS NULL)
            OR (status = 'RUNNING' AND started_at IS NOT NULL AND completed_at IS NULL)
            OR (status IN ('SUCCEEDED', 'FAILED') AND started_at IS NOT NULL AND completed_at >= started_at)
            OR (status = 'CANCELLED' AND completed_at IS NOT NULL AND (started_at IS NULL OR completed_at >= started_at))
        )
);

CREATE TABLE processing_job_dispatches (
    job_id uuid PRIMARY KEY,
    status varchar(16) NOT NULL,
    attempt_count integer NOT NULL DEFAULT 0,
    next_attempt_at timestamptz NOT NULL,
    last_error_code varchar(64),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    dispatched_at timestamptz,
    CONSTRAINT fk_processing_job_dispatches_job
        FOREIGN KEY (job_id) REFERENCES processing_jobs(id) ON DELETE CASCADE,
    CONSTRAINT chk_processing_job_dispatches_status
        CHECK (status IN ('PENDING', 'DISPATCHED', 'CANCELLED', 'FAILED')),
    CONSTRAINT chk_processing_job_dispatches_attempt_count
        CHECK (attempt_count >= 0),
    CONSTRAINT chk_processing_job_dispatches_timestamps
        CHECK (
            updated_at >= created_at
            AND next_attempt_at >= created_at
            AND (dispatched_at IS NULL OR dispatched_at BETWEEN created_at AND updated_at)
        ),
    CONSTRAINT chk_processing_job_dispatches_terminal
        CHECK (
            (status = 'PENDING' AND dispatched_at IS NULL)
            OR (status = 'DISPATCHED' AND dispatched_at IS NOT NULL)
            OR (status = 'CANCELLED' AND dispatched_at IS NULL)
            OR (status = 'FAILED' AND dispatched_at IS NULL AND last_error_code IS NOT NULL)
        )
);

CREATE INDEX idx_processing_job_dispatches_pending
    ON processing_job_dispatches (next_attempt_at, job_id)
    WHERE status = 'PENDING';
