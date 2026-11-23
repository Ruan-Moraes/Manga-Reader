CREATE TABLE stores (
    id              UUID            NOT NULL PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    logo            VARCHAR(255),
    icon            VARCHAR(255),
    description     VARCHAR(2000),
    website         VARCHAR(255)    NOT NULL,
    availability    VARCHAR(20),
    rating          DOUBLE PRECISION,
    features        JSONB           DEFAULT '[]'::jsonb
);

CREATE TABLE store_titles (
    id          UUID            NOT NULL PRIMARY KEY,
    store_id    UUID            NOT NULL,
    title_id    VARCHAR(255)    NOT NULL,
    url         VARCHAR(500),

    CONSTRAINT fk_store_titles_store FOREIGN KEY (store_id) REFERENCES stores (id),
    CONSTRAINT uk_store_titles_store_title UNIQUE (store_id, title_id)
);

CREATE INDEX idx_store_titles_store ON store_titles (store_id);
