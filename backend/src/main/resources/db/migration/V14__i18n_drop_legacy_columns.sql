-- ============================================================================
-- Etapa B (i18n) — Fase B: drop colunas legadas após consolidação.
--
-- Pre-requisito: V12 já backfillou *_i18n a partir das colunas legadas.
-- Aplicação atual lê majoritariamente do JSONB (Fase A); este passo remove
-- definitivamente os campos planos. Após esta migração, V15 renomeia
-- <campo>_i18n para <campo> (nome canônico final).
-- ============================================================================

ALTER TABLE tags DROP COLUMN label;

ALTER TABLE events
    DROP COLUMN title,
    DROP COLUMN subtitle,
    DROP COLUMN description;

ALTER TABLE groups
    DROP COLUMN name,
    DROP COLUMN description;

ALTER TABLE stores
    DROP COLUMN name,
    DROP COLUMN description;

ALTER TABLE subscription_plans
    DROP COLUMN description,
    DROP COLUMN features;
