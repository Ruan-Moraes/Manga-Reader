CREATE TABLE groups (
    id                  UUID            NOT NULL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    username            VARCHAR(50)     NOT NULL UNIQUE,
    logo                VARCHAR(255),
    banner              VARCHAR(255),
    description         VARCHAR(2000),
    website             VARCHAR(255),
    total_titles        INTEGER         DEFAULT 0,
    founded_year        INTEGER,
    status              VARCHAR(20)     NOT NULL,
    genres              JSONB           DEFAULT '[]'::jsonb,
    focus_tags          JSONB           DEFAULT '[]'::jsonb,
    rating              DOUBLE PRECISION DEFAULT 0.0,
    popularity          INTEGER         DEFAULT 0,
    platform_joined_at  TIMESTAMP
);

CREATE TABLE group_users (
    id          UUID        NOT NULL PRIMARY KEY,
    group_id    UUID        NOT NULL,
    user_id     UUID        NOT NULL,
    role        VARCHAR(30),
    type        VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at   TIMESTAMP,

    CONSTRAINT fk_group_users_group FOREIGN KEY (group_id) REFERENCES groups (id),
    CONSTRAINT fk_group_users_user  FOREIGN KEY (user_id)  REFERENCES users (id),
    CONSTRAINT uk_group_users_group_user UNIQUE (group_id, user_id)
);

CREATE TABLE group_works (
    id          UUID            NOT NULL PRIMARY KEY,
    group_id    UUID            NOT NULL,
    title_id    VARCHAR(255)    NOT NULL,
    title       VARCHAR(200)    NOT NULL,
    cover       VARCHAR(255),
    chapters    INTEGER         DEFAULT 0,
    status      VARCHAR(20)     NOT NULL,
    popularity  INTEGER         DEFAULT 0,
    genres      JSONB           DEFAULT '[]'::jsonb,
    updated_at  TIMESTAMP,

    CONSTRAINT fk_group_works_group FOREIGN KEY (group_id) REFERENCES groups (id)
);

CREATE INDEX idx_group_users_group ON group_users (group_id);
CREATE INDEX idx_group_users_user  ON group_users (user_id);
CREATE INDEX idx_group_users_type  ON group_users (type);
CREATE INDEX idx_group_works_group ON group_works (group_id);
