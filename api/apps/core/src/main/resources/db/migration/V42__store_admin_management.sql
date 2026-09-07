-- Administração de lojas: status/ordem e URL de compra obrigatória por título.
ALTER TABLE stores
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_stores_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    ADD CONSTRAINT chk_stores_display_order CHECK (display_order >= 0);

-- Vínculos legados sem URL passam a abrir a página principal da loja.
UPDATE store_titles st
SET url = s.website
FROM stores s
WHERE st.store_id = s.id AND (st.url IS NULL OR btrim(st.url) = '');

ALTER TABLE store_titles
    ALTER COLUMN url SET NOT NULL,
    ADD CONSTRAINT chk_store_titles_url_not_blank CHECK (btrim(url) <> '');

-- Lista administrativa filtrada por status e ordenada por prioridade.
CREATE INDEX idx_stores_status_display_order ON stores (status, display_order, id);
-- Busca administrativa por qualquer tradução do nome da loja.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_stores_name_trgm ON stores USING gin ((name::text) gin_trgm_ops);
