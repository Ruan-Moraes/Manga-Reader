ALTER TABLE users
    ADD COLUMN ui_locale VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    ADD COLUMN content_locales JSONB NOT NULL DEFAULT '["pt-BR"]'::jsonb;
