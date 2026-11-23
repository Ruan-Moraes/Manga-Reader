-- Substitui o índice legado sem bloquear escritas em groups durante o build.
-- O índice antigo permanece disponível até o novo GIN estar completamente criado.
-- Flyway/PostgreSQL executa esta migration fora de transação porque ambos os
-- comandos CONCURRENTLY não podem rodar dentro de um bloco transacional.
-- Um retry remove primeiro apenas o candidato novo: um build concorrente
-- interrompido pode deixar um índice INVALID que IF NOT EXISTS não reconstruiria.
DROP INDEX CONCURRENTLY IF EXISTS idx_groups_name_values_trgm;

CREATE INDEX CONCURRENTLY idx_groups_name_values_trgm
    ON groups USING gin (mr_localized_values_search(name) gin_trgm_ops);

DROP INDEX CONCURRENTLY IF EXISTS idx_groups_name_trgm;
