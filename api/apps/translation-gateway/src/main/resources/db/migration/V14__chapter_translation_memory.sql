-- Chapter memory: pages of one chapter share an opaque client-generated context_ref, so a name translated on one
-- page ("Coriander" -> "Coentro") is translated the same way on the next ones instead of being decided anew.
--
-- processing_jobs.context_ref: optional; NULL keeps the page on its own (every job before V12, and clients that do
-- not send it). It is only a grouping key the client chose: no FK, nothing is created for it.
ALTER TABLE processing_jobs ADD COLUMN context_ref uuid;

-- One decided term per (installation, context, language pair, source term): target_term depends on the whole key
-- and nothing else (BCNF). The installation owns its memory (ON DELETE CASCADE): a context of one installation is
-- never visible to another. Terms are page content, so they follow the result retention (at most one hour,
-- disclosed): expires_at is set from the job's result retention when a term is written and renewed only when a
-- later page of the chapter uses the term again; expired rows are never read and are deleted by the cleanup.
CREATE TABLE translation_context_terms (
    installation_id uuid NOT NULL,
    context_ref uuid NOT NULL,
    source_language varchar(16) NOT NULL,
    target_language varchar(16) NOT NULL,
    source_term varchar(64) NOT NULL,
    target_term varchar(128) NOT NULL,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    CONSTRAINT pk_translation_context_terms
        PRIMARY KEY (installation_id, context_ref, source_language, target_language, source_term),
    CONSTRAINT fk_translation_context_terms_installation
        FOREIGN KEY (installation_id) REFERENCES anonymous_installations(id) ON DELETE CASCADE,
    CONSTRAINT chk_translation_context_terms_language
        CHECK (
            source_language IN ('ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR')
            AND target_language IN ('ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR')
            AND source_language <> target_language
        ),
    CONSTRAINT chk_translation_context_terms_text
        CHECK (length(btrim(source_term)) > 0 AND length(btrim(target_term)) > 0),
    CONSTRAINT chk_translation_context_terms_expiry
        CHECK (expires_at > created_at AND expires_at <= created_at + interval '1 day')
);

-- Reads go through the primary key prefix (installation_id, context_ref, source_language, target_language); the
-- cleanup deletes by expiry in bounded batches.
CREATE INDEX idx_translation_context_terms_expired
    ON translation_context_terms (expires_at);
