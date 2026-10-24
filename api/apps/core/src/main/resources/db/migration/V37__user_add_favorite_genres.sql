ALTER TABLE users
    ADD COLUMN favorite_genres JSONB NOT NULL DEFAULT '[]'::jsonb;
