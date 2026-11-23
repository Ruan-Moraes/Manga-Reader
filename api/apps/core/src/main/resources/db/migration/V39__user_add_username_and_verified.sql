-- DT-48: identidade social — handle único (claim pelo usuário; NULL até escolher)
-- e selo verificado (mutação só administrativa nesta leva).
ALTER TABLE users
    ADD COLUMN username VARCHAR(30),
    ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD CONSTRAINT chk_users_username_format CHECK (username ~ '^[a-z0-9_]{3,30}$');

CREATE UNIQUE INDEX uk_users_username_lower ON users (lower(username));
