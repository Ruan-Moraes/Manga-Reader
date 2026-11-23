-- Corrige a busca de grupos para indexar somente os valores traduzidos de name.
-- A serializacao do jsonb inteiro tambem indexava chaves de locale e podia
-- produzir correspondencias falsas para termos como "pt" e "en".
CREATE OR REPLACE FUNCTION mr_localized_values_search(value jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
    SELECT public.mr_normalize_search(COALESCE(
        string_agg(entry.value, ' ' ORDER BY entry.key),
        ''))
    FROM jsonb_each_text(value) AS entry
$$;
