CREATE TABLE user_profile_settings (
    user_id UUID PRIMARY KEY,
    comment_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    view_history_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    adult_content_preference VARCHAR(20) NOT NULL DEFAULT 'BLUR',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_user_profile_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_profile_settings_comment_visibility
        CHECK (comment_visibility IN ('PUBLIC', 'PRIVATE', 'DO_NOT_TRACK')),
    CONSTRAINT chk_user_profile_settings_view_history_visibility
        CHECK (view_history_visibility IN ('PUBLIC', 'PRIVATE', 'DO_NOT_TRACK')),
    CONSTRAINT chk_user_profile_settings_adult_content_preference
        CHECK (adult_content_preference IN ('BLUR', 'SHOW', 'HIDE'))
);

INSERT INTO user_profile_settings (
    user_id,
    comment_visibility,
    view_history_visibility,
    adult_content_preference,
    created_at,
    updated_at
)
SELECT
    id,
    comment_visibility,
    view_history_visibility,
    adult_content_preference,
    created_at,
    updated_at
FROM users
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS chk_users_adult_content_preference,
    DROP CONSTRAINT IF EXISTS chk_users_comment_visibility,
    DROP CONSTRAINT IF EXISTS chk_users_view_history_visibility,
    DROP COLUMN IF EXISTS adult_content_preference,
    DROP COLUMN IF EXISTS comment_visibility,
    DROP COLUMN IF EXISTS view_history_visibility;
