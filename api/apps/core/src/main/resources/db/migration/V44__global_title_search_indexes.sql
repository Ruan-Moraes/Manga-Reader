-- Índices para localizar títulos pelas relações de autor/artista e grupo.
-- pg_trgm cobre os predicados ILIKE '%termo%' usados pela busca global.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper imutável para permitir o mesmo pipeline de normalização em índices
-- funcionais e nas consultas (caixa, acentos, pontuação e espaços).
CREATE OR REPLACE FUNCTION mr_normalize_search(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
    SELECT trim(regexp_replace(
        regexp_replace(lower(public.unaccent('public.unaccent', value)), '[^[:alnum:][:space:]]+', ' ', 'g'),
        '[[:space:]]+', ' ', 'g'))
$$;

CREATE INDEX IF NOT EXISTS idx_authors_name_trgm
    ON authors USING gin (mr_normalize_search(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_groups_name_trgm
    ON groups USING gin (mr_normalize_search(name::text) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_groups_username_trgm
    ON groups USING gin (mr_normalize_search(username) gin_trgm_ops);
