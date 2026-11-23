ALTER TABLE tags
    ADD COLUMN label_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE tags
   SET label_i18n = jsonb_build_object('pt-BR', label)
 WHERE label IS NOT NULL;

ALTER TABLE events
    ADD COLUMN title_i18n       JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN subtitle_i18n    JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE events
   SET title_i18n       = jsonb_build_object('pt-BR', title),
       subtitle_i18n    = CASE WHEN subtitle    IS NOT NULL THEN jsonb_build_object('pt-BR', subtitle)    ELSE '{}'::jsonb END,
       description_i18n = CASE WHEN description IS NOT NULL THEN jsonb_build_object('pt-BR', description) ELSE '{}'::jsonb END;

ALTER TABLE groups
    ADD COLUMN name_i18n        JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE groups
   SET name_i18n        = jsonb_build_object('pt-BR', name),
       description_i18n = CASE WHEN description IS NOT NULL THEN jsonb_build_object('pt-BR', description) ELSE '{}'::jsonb END;

ALTER TABLE stores
    ADD COLUMN name_i18n        JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE stores
   SET name_i18n        = jsonb_build_object('pt-BR', name),
       description_i18n = CASE WHEN description IS NOT NULL THEN jsonb_build_object('pt-BR', description) ELSE '{}'::jsonb END;

ALTER TABLE subscription_plans
    ADD COLUMN description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN features_i18n    JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE subscription_plans
   SET description_i18n = jsonb_build_object('pt-BR', description),
       features_i18n    = jsonb_build_object('pt-BR', features);
