-- Expande os fundos persistidos do leitor. Os valores existentes permanecem válidos.
ALTER TABLE user_system_settings
    DROP CONSTRAINT chk_user_system_settings_reader_background;

ALTER TABLE user_system_settings
    ADD CONSTRAINT chk_user_system_settings_reader_background
        CHECK (reader_background IN ('BLACK', 'DARK', 'PAPER', 'LIGHT', 'WHITE'));
