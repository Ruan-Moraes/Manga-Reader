CREATE TABLE user_system_settings (
    user_id UUID PRIMARY KEY,
    reader_direction VARCHAR(20) NOT NULL DEFAULT 'RTL',
    reader_mode VARCHAR(20) NOT NULL DEFAULT 'VERTICAL',
    reader_fit VARCHAR(20) NOT NULL DEFAULT 'WIDTH',
    reader_quality VARCHAR(20) NOT NULL DEFAULT 'AUTO',
    reader_gap INTEGER NOT NULL DEFAULT 8,
    reader_background VARCHAR(20) NOT NULL DEFAULT 'DARK',
    auto_mark_read BOOLEAN NOT NULL DEFAULT TRUE,
    preload_pages INTEGER NOT NULL DEFAULT 3,
    appearance_theme VARCHAR(20) NOT NULL DEFAULT 'DARK',
    font_size VARCHAR(20) NOT NULL DEFAULT 'DEFAULT',
    density VARCHAR(20) NOT NULL DEFAULT 'COMFORTABLE',
    animations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    date_format VARCHAR(20) NOT NULL DEFAULT 'D_MON',
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
    reduce_motion BOOLEAN NOT NULL DEFAULT FALSE,
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    CONSTRAINT fk_user_system_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_system_settings_reader_direction
        CHECK (reader_direction IN ('LTR', 'RTL', 'WEBTOON')),
    CONSTRAINT chk_user_system_settings_reader_mode
        CHECK (reader_mode IN ('VERTICAL', 'PAGED', 'DOUBLE')),
    CONSTRAINT chk_user_system_settings_reader_fit
        CHECK (reader_fit IN ('WIDTH', 'HEIGHT', 'ORIGINAL')),
    CONSTRAINT chk_user_system_settings_reader_quality
        CHECK (reader_quality IN ('AUTO', 'LOW', 'MEDIUM', 'HIGH', 'ORIGINAL')),
    CONSTRAINT chk_user_system_settings_reader_gap
        CHECK (reader_gap BETWEEN 0 AND 32),
    CONSTRAINT chk_user_system_settings_reader_background
        CHECK (reader_background IN ('BLACK', 'DARK', 'PAPER')),
    CONSTRAINT chk_user_system_settings_preload_pages
        CHECK (preload_pages BETWEEN 0 AND 10),
    CONSTRAINT chk_user_system_settings_appearance_theme
        CHECK (appearance_theme IN ('DARK', 'LIGHT', 'SYSTEM')),
    CONSTRAINT chk_user_system_settings_font_size
        CHECK (font_size IN ('COMPACT', 'DEFAULT', 'COMFORTABLE')),
    CONSTRAINT chk_user_system_settings_density
        CHECK (density IN ('COMFORTABLE', 'COMPACT')),
    CONSTRAINT chk_user_system_settings_date_format
        CHECK (date_format IN ('D_MON', 'D_M', 'MON_D')),
    CONSTRAINT chk_user_system_settings_timezone
        CHECK (timezone IN ('America/Sao_Paulo', 'America/New_York', 'Europe/Lisbon', 'Asia/Tokyo', 'UTC'))
);

INSERT INTO user_system_settings (
    user_id,
    reader_direction,
    reader_mode,
    reader_fit,
    reader_quality,
    reader_gap,
    reader_background,
    auto_mark_read,
    preload_pages,
    appearance_theme,
    font_size,
    density,
    animations_enabled,
    date_format,
    timezone,
    reduce_motion,
    high_contrast,
    created_at,
    updated_at
)
SELECT
    id,
    CASE
        WHEN settings #>> '{reader,direction}' IN ('LTR', 'RTL', 'WEBTOON') THEN settings #>> '{reader,direction}'
        ELSE 'RTL'
    END,
    CASE
        WHEN settings #>> '{reader,mode}' IN ('VERTICAL', 'PAGED', 'DOUBLE') THEN settings #>> '{reader,mode}'
        ELSE 'VERTICAL'
    END,
    CASE
        WHEN settings #>> '{reader,fit}' IN ('WIDTH', 'HEIGHT', 'ORIGINAL') THEN settings #>> '{reader,fit}'
        ELSE 'WIDTH'
    END,
    CASE
        WHEN settings #>> '{reader,quality}' IN ('AUTO', 'LOW', 'MEDIUM', 'HIGH', 'ORIGINAL') THEN settings #>> '{reader,quality}'
        ELSE 'AUTO'
    END,
    CASE
        WHEN settings #>> '{reader,gap}' ~ '^[0-9]+$' THEN
            CASE
                WHEN (settings #>> '{reader,gap}')::INTEGER BETWEEN 0 AND 32 THEN (settings #>> '{reader,gap}')::INTEGER
                ELSE 8
            END
        ELSE 8
    END,
    CASE
        WHEN settings #>> '{reader,background}' IN ('BLACK', 'DARK', 'PAPER') THEN settings #>> '{reader,background}'
        ELSE 'DARK'
    END,
    CASE
        WHEN lower(settings #>> '{reader,autoMarkRead}') IN ('true', 'false') THEN (settings #>> '{reader,autoMarkRead}')::BOOLEAN
        ELSE TRUE
    END,
    CASE
        WHEN settings #>> '{reader,preload}' ~ '^[0-9]+$' THEN
            CASE
                WHEN (settings #>> '{reader,preload}')::INTEGER BETWEEN 0 AND 10 THEN (settings #>> '{reader,preload}')::INTEGER
                ELSE 3
            END
        ELSE 3
    END,
    CASE
        WHEN settings #>> '{appearance,theme}' IN ('DARK', 'LIGHT', 'SYSTEM') THEN settings #>> '{appearance,theme}'
        ELSE 'DARK'
    END,
    CASE
        WHEN settings #>> '{appearance,fontSize}' IN ('COMPACT', 'DEFAULT', 'COMFORTABLE') THEN settings #>> '{appearance,fontSize}'
        ELSE 'DEFAULT'
    END,
    CASE
        WHEN settings #>> '{appearance,density}' IN ('COMFORTABLE', 'COMPACT') THEN settings #>> '{appearance,density}'
        ELSE 'COMFORTABLE'
    END,
    CASE
        WHEN lower(settings #>> '{appearance,animations}') IN ('true', 'false') THEN (settings #>> '{appearance,animations}')::BOOLEAN
        ELSE TRUE
    END,
    CASE
        WHEN settings #>> '{locale,dateFormat}' IN ('D_MON', 'D_M', 'MON_D') THEN settings #>> '{locale,dateFormat}'
        ELSE 'D_MON'
    END,
    CASE
        WHEN settings #>> '{locale,timezone}' IN ('America/Sao_Paulo', 'America/New_York', 'Europe/Lisbon', 'Asia/Tokyo', 'UTC') THEN settings #>> '{locale,timezone}'
        ELSE 'America/Sao_Paulo'
    END,
    CASE
        WHEN lower(settings #>> '{accessibility,reduceMotion}') IN ('true', 'false') THEN (settings #>> '{accessibility,reduceMotion}')::BOOLEAN
        ELSE FALSE
    END,
    CASE
        WHEN lower(settings #>> '{accessibility,highContrast}') IN ('true', 'false') THEN (settings #>> '{accessibility,highContrast}')::BOOLEAN
        ELSE FALSE
    END,
    created_at,
    updated_at
FROM users;

ALTER TABLE users
    DROP COLUMN settings;
