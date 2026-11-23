-- OCR text stays in private object storage; PostgreSQL records only its integrity metadata.
ALTER TABLE processing_job_stages
    ADD COLUMN output_object_key varchar(512),
    ADD COLUMN output_sha256 char(64),
    ADD CONSTRAINT chk_processing_job_stages_output_pair
        CHECK ((output_object_key IS NULL) = (output_sha256 IS NULL)),
    ADD CONSTRAINT chk_processing_job_stages_output_hash
        CHECK (output_sha256 IS NULL OR output_sha256 ~ '^[0-9a-f]{64}$'),
    ADD CONSTRAINT chk_processing_job_stages_ocr_output
        CHECK (stage <> 'OCR' OR status <> 'SUCCEEDED' OR output_object_key IS NOT NULL);
