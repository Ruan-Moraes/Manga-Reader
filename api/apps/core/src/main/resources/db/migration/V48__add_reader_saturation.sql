-- Persiste a intensidade de cor do leitor sem alterar os arquivos de capítulo existentes.
ALTER TABLE user_system_settings
    ADD COLUMN reader_saturation INTEGER NOT NULL DEFAULT 100,
    ADD CONSTRAINT chk_user_system_settings_reader_saturation
        CHECK (reader_saturation BETWEEN 0 AND 100);
