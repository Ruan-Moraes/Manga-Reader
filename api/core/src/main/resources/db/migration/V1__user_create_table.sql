CREATE TABLE users (
    id                          UUID            NOT NULL PRIMARY KEY,
    name                        VARCHAR(100)    NOT NULL,
    email                       VARCHAR(255)    NOT NULL UNIQUE,
    password_hash               VARCHAR(255)    NOT NULL,
    bio                         VARCHAR(500),
    photo_url                   VARCHAR(255),
    banner_url                  VARCHAR(255),
    role                        VARCHAR(20)     NOT NULL,
    adult_content_preference    VARCHAR(20)     NOT NULL DEFAULT 'BLUR',
    comment_visibility          VARCHAR(20)     NOT NULL DEFAULT 'PUBLIC',
    view_history_visibility     VARCHAR(20)     NOT NULL DEFAULT 'PUBLIC',
    created_at                  TIMESTAMP       NOT NULL,
    updated_at                  TIMESTAMP
);
