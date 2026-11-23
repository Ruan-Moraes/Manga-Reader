CREATE TABLE authors (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    slug        VARCHAR(255)    NOT NULL UNIQUE,
    bio         TEXT,
    nationality VARCHAR(10),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_authors_name ON authors (name);

CREATE TABLE publishers (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(255)    NOT NULL,
    slug        VARCHAR(255)    NOT NULL UNIQUE,
    country     VARCHAR(10),
    website     VARCHAR(512),
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_publishers_name ON publishers (name);

CREATE TABLE title_authors (
    id          BIGSERIAL       PRIMARY KEY,
    title_id    VARCHAR(24)     NOT NULL,
    author_id   BIGINT          NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    role        VARCHAR(50)     NOT NULL DEFAULT 'AUTHOR',
    CONSTRAINT uq_title_authors UNIQUE (title_id, author_id, role),
    CONSTRAINT chk_title_authors_role CHECK (
        role IN ('AUTHOR', 'ARTIST', 'STORY', 'LETTERER', 'COLORIST', 'EDITOR')
    )
);
CREATE INDEX idx_title_authors_title  ON title_authors (title_id);
CREATE INDEX idx_title_authors_author ON title_authors (author_id);

CREATE TABLE title_publishers (
    id              BIGSERIAL       PRIMARY KEY,
    title_id        VARCHAR(24)     NOT NULL,
    publisher_id    BIGINT          NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
    CONSTRAINT uq_title_publishers UNIQUE (title_id, publisher_id)
);
CREATE INDEX idx_title_publishers_title     ON title_publishers (title_id);
CREATE INDEX idx_title_publishers_publisher ON title_publishers (publisher_id);
