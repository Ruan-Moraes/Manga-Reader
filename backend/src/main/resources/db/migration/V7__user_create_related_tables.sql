-- =============================================================================
-- V7: user_social_links + user_libraries + user_recommendations
-- =============================================================================

CREATE TABLE user_social_links (
    id          UUID            NOT NULL PRIMARY KEY,
    user_id     UUID            NOT NULL,
    platform    VARCHAR(50)     NOT NULL,
    url         VARCHAR(500)    NOT NULL,

    CONSTRAINT fk_social_links_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE user_libraries (
    id          UUID            NOT NULL PRIMARY KEY,
    user_id     UUID            NOT NULL,
    title_id    VARCHAR(255)    NOT NULL,
    name        VARCHAR(200)    NOT NULL,
    cover       VARCHAR(255),
    type        VARCHAR(50),
    list        VARCHAR(20)     NOT NULL,
    saved_at    TIMESTAMP,

    CONSTRAINT fk_user_libraries_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uk_user_libraries_user_title UNIQUE (user_id, title_id)
);

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

CREATE INDEX idx_user_social_links_user       ON user_social_links (user_id);
CREATE INDEX idx_user_libraries_user          ON user_libraries (user_id);
CREATE INDEX idx_user_libraries_user_list     ON user_libraries (user_id, list);
CREATE INDEX idx_user_recommendations_user    ON user_recommendations (user_id);
