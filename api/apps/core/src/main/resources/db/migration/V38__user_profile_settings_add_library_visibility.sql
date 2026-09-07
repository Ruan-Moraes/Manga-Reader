-- DT-49: biblioteca pública deve respeitar visibilidade, no mesmo padrão de
-- comment_visibility/view_history_visibility do enriched profile.
ALTER TABLE user_profile_settings
    ADD COLUMN library_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE user_profile_settings
    ADD CONSTRAINT chk_user_profile_settings_library_visibility
        CHECK (library_visibility IN ('PUBLIC', 'PRIVATE', 'DO_NOT_TRACK'));
