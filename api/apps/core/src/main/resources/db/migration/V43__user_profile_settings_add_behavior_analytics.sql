-- Preferência privada de analytics, separada da visibilidade social do histórico.
ALTER TABLE user_profile_settings
    ADD COLUMN behavior_analytics_enabled boolean NOT NULL DEFAULT true;

UPDATE user_profile_settings
SET behavior_analytics_enabled = false
WHERE view_history_visibility = 'DO_NOT_TRACK';
