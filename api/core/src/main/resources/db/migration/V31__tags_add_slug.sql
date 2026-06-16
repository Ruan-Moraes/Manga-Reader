ALTER TABLE tags ADD COLUMN slug VARCHAR(60);

UPDATE tags
SET slug = trim(BOTH '_' FROM regexp_replace(
        upper(coalesce(NULLIF(label->>'en-US', ''), label->>'pt-BR')),
        '[^A-Z0-9]+', '_', 'g'))
WHERE slug IS NULL;

ALTER TABLE tags ALTER COLUMN slug SET NOT NULL;
ALTER TABLE tags ADD CONSTRAINT uq_tags_slug UNIQUE (slug);
