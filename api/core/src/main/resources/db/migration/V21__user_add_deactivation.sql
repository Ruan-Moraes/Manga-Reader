-- Exclusão de conta (soft-delete + anonimização): a conta é desativada e os dados
-- pessoais anonimizados, preservando integridade referencial (comentários/relacionamentos).
ALTER TABLE users ADD COLUMN deactivated    BOOLEAN   NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP;

-- Consulta de membros por usuário (aba "Grupos" do perfil + remoção de vínculos na exclusão).
CREATE INDEX IF NOT EXISTS idx_group_users_user_id ON group_users (user_id);
