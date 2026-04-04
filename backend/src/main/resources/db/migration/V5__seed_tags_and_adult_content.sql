-- ---------------------------------------------------------------------------
-- V5: Seed default tags + add adult_content_preference to users
-- ---------------------------------------------------------------------------

-- Seed tags (gêneros comuns em plataformas de mangá)
INSERT INTO tags (label) VALUES
    ('Ação'), ('Aventura'), ('Comédia'), ('Drama'), ('Fantasia'),
    ('Horror'), ('Mistério'), ('Romance'), ('Sci-Fi'), ('Slice of Life'),
    ('Esportes'), ('Sobrenatural'), ('Thriller'), ('Histórico'), ('Mecha'),
    ('Musical'), ('Psicológico'), ('Shounen'), ('Shoujo'), ('Seinen'),
    ('Josei'), ('Isekai'), ('Harem'), ('Ecchi'), ('Escolar'),
    ('Artes Marciais'), ('Militar'), ('Policial'), ('Super Poderes'), ('Vampiro'),
    ('Magia'), ('Demônios'), ('Jogo'), ('Paródia'), ('Espacial');

-- Preferência de conteúdo adulto do usuário (BLUR = padrão)
ALTER TABLE users ADD COLUMN adult_content_preference VARCHAR(20) NOT NULL DEFAULT 'BLUR';
