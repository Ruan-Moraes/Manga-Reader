-- Busca global multicategoria: metadados públicos, aliases normalizados e índices.
-- Aliases são tabelas filhas porque participam de filtro/ranking e exigem
-- integridade/uniqueness; contagens continuam derivadas das junções existentes.

ALTER TABLE authors
    ADD COLUMN image_url varchar(512);

ALTER TABLE publishers
    ADD COLUMN logo_url varchar(512),
    ADD COLUMN description text;

CREATE TABLE author_aliases (
    id        bigserial PRIMARY KEY,
    author_id bigint       NOT NULL,
    name      varchar(255) NOT NULL,
    type      varchar(30)  NOT NULL,
    CONSTRAINT fk_author_aliases_author
        FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    CONSTRAINT chk_author_aliases_name
        CHECK (btrim(name) <> ''),
    CONSTRAINT chk_author_aliases_type
        CHECK (type IN ('ALTERNATE', 'PEN_NAME'))
);

CREATE TABLE publisher_aliases (
    id           bigserial PRIMARY KEY,
    publisher_id bigint       NOT NULL,
    name         varchar(255) NOT NULL,
    type         varchar(30)  NOT NULL,
    CONSTRAINT fk_publisher_aliases_publisher
        FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE CASCADE,
    CONSTRAINT chk_publisher_aliases_name
        CHECK (btrim(name) <> ''),
    CONSTRAINT chk_publisher_aliases_type
        CHECK (type IN ('ALTERNATE', 'ABBREVIATION', 'ORIGINAL'))
);

-- Estes UNIQUE funcionais também cobrem o prefixo de FK; não criar índices
-- simples redundantes em author_id/publisher_id.
CREATE UNIQUE INDEX uq_author_aliases_normalized
    ON author_aliases (author_id, mr_normalize_search(name));
CREATE UNIQUE INDEX uq_publisher_aliases_normalized
    ON publisher_aliases (publisher_id, mr_normalize_search(name));

CREATE INDEX idx_author_aliases_name_trgm
    ON author_aliases USING gin (mr_normalize_search(name) gin_trgm_ops);
CREATE INDEX idx_publishers_name_trgm
    ON publishers USING gin (mr_normalize_search(name) gin_trgm_ops);
CREATE INDEX idx_publisher_aliases_name_trgm
    ON publisher_aliases USING gin (mr_normalize_search(name) gin_trgm_ops);

-- Consultas de papéis/obras por pessoa passam a ser cobertas por um único índice.
DROP INDEX IF EXISTS idx_title_authors_author;
CREATE INDEX idx_title_authors_author_role_title
    ON title_authors (author_id, role, title_id);

INSERT INTO domain_labels (type, value, label_i18n) VALUES
('author_role', 'AUTHOR',   '{"pt-BR":"Autor","en-US":"Author","es-ES":"Autor"}'),
('author_role', 'ARTIST',   '{"pt-BR":"Artista","en-US":"Artist","es-ES":"Artista"}'),
('author_role', 'STORY',    '{"pt-BR":"Roteiro","en-US":"Story","es-ES":"Guion"}'),
('author_role', 'LETTERER', '{"pt-BR":"Letrista","en-US":"Letterer","es-ES":"Rotulista"}'),
('author_role', 'COLORIST', '{"pt-BR":"Colorista","en-US":"Colorist","es-ES":"Colorista"}'),
('author_role', 'EDITOR',   '{"pt-BR":"Editor","en-US":"Editor","es-ES":"Editor"}'),
('author_alias_type', 'ALTERNATE', '{"pt-BR":"Nome alternativo","en-US":"Alternate name","es-ES":"Nombre alternativo"}'),
('author_alias_type', 'PEN_NAME',  '{"pt-BR":"Pseudônimo","en-US":"Pen name","es-ES":"Seudónimo"}'),
('publisher_alias_type', 'ALTERNATE',    '{"pt-BR":"Nome alternativo","en-US":"Alternate name","es-ES":"Nombre alternativo"}'),
('publisher_alias_type', 'ABBREVIATION', '{"pt-BR":"Abreviação","en-US":"Abbreviation","es-ES":"Abreviatura"}'),
('publisher_alias_type', 'ORIGINAL',     '{"pt-BR":"Nome original","en-US":"Original name","es-ES":"Nombre original"}'),
('title_alias_type', 'ALTERNATE', '{"pt-BR":"Título alternativo","en-US":"Alternate title","es-ES":"Título alternativo"}'),
('title_alias_type', 'SYNONYM',   '{"pt-BR":"Sinônimo","en-US":"Synonym","es-ES":"Sinónimo"}');
