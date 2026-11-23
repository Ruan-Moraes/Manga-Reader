-- Text stays in private object storage; the existing stage row stores integrity metadata only.
ALTER TABLE processing_job_stages
    ADD CONSTRAINT chk_processing_job_stages_translation_output
        CHECK (stage <> 'TRANSLATING' OR status <> 'SUCCEEDED' OR output_object_key IS NOT NULL);
