ALTER TABLE users ADD COLUMN banner_url VARCHAR(255);
ALTER TABLE users ADD COLUMN comment_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE users ADD COLUMN view_history_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';

CREATE TABLE user_recommendations (
    id          UUID            NOT NULL PRIMARY KEY,
    user_id     UUID            NOT NULL,
    title_id    VARCHAR(255)    NOT NULL,
    title_name  VARCHAR(200)    NOT NULL,
    title_cover VARCHAR(255),
    position    INTEGER         DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL,
    CONSTRAINT fk_user_recommendations_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uk_user_recommendations_user_title UNIQUE (user_id, title_id)
);
CREATE INDEX idx_user_recommendations_user ON user_recommendations (user_id);
