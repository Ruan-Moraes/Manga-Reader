-- Rotação de refresh tokens com detecção de reuso por família (OAuth BCP).
-- Armazena apenas o SHA-256 hex do JWT (nunca o token em claro): vazamento do
-- banco não vaza sessões. revoked_at NULL = ativo; token já revogado sendo
-- reapresentado indica reuso → a família inteira (sessão) é revogada.
CREATE TABLE refresh_tokens (
    id          UUID        NOT NULL PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    family_id   UUID        NOT NULL,
    expires_at  TIMESTAMP   NOT NULL,
    revoked_at  TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL
);

-- Lookup no refresh (um por request autenticado que rotaciona)
CREATE UNIQUE INDEX uk_refresh_tokens_token_hash ON refresh_tokens (token_hash);
-- Revogação em lote da família (reuso detectado / logout)
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens (family_id);
-- FK + revogar todas as sessões de um usuário
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
-- Purge diário de expirados
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
