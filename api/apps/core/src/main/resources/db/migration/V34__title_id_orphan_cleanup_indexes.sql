-- Índices em title_id para a limpeza de órfãos cross-DB (DT-10).
--
-- As refs cross-DB (title_id → Mongo titles._id) não têm FK física. A limpeza
-- síncrona (DeleteTitleUseCase) e o job diário (orphan-cleaner) varrem por
-- title_id; sem índice leading, cada DELETE/DISTINCT faz seq scan.
--
-- Os índices compostos existentes não servem: liderados por user_id/group_id/
-- store_id (prefixo mais à esquerda ≠ title_id). title_authors/title_publishers
-- já têm idx_*_title (V33), por isso ficam de fora.

CREATE INDEX idx_user_libraries_title ON user_libraries (title_id);

CREATE INDEX idx_group_works_title ON group_works (title_id);

CREATE INDEX idx_store_titles_title ON store_titles (title_id);
