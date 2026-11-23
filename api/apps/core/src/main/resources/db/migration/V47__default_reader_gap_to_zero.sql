-- Novas configurações do leitor iniciam sem espaço entre páginas; as preferências existentes são preservadas.
ALTER TABLE user_system_settings
    ALTER COLUMN reader_gap SET DEFAULT 0;
