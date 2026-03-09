-- V2: Cria a tabela store_titles caso não exista (adicionada após a execução
--     inicial da V1).

CREATE TABLE IF NOT EXISTS store_titles (
    id          UUID            NOT NULL PRIMARY KEY,
    store_id    UUID            NOT NULL,
    title_id    VARCHAR(255)    NOT NULL,
    url         VARCHAR(500),

    CONSTRAINT fk_store_titles_store FOREIGN KEY (store_id) REFERENCES stores (id),
    CONSTRAINT uk_store_titles_store_title UNIQUE (store_id, title_id)
);

CREATE INDEX IF NOT EXISTS idx_store_titles_store ON store_titles (store_id);
