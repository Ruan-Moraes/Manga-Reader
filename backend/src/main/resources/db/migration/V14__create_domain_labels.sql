CREATE TABLE domain_labels (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(60) NOT NULL,
    value      VARCHAR(60) NOT NULL,
    label_i18n JSONB       NOT NULL DEFAULT '{}',
    CONSTRAINT uq_domain_labels_type_value UNIQUE (type, value)
);

INSERT INTO domain_labels (type, value, label_i18n) VALUES
-- publication_status
('publication_status', 'ONGOING',   '{"pt-BR":"Em andamento","en-US":"Ongoing","es-ES":"En curso"}'),
('publication_status', 'COMPLETE',  '{"pt-BR":"Completo","en-US":"Complete","es-ES":"Completo"}'),
('publication_status', 'HIATUS',    '{"pt-BR":"Hiato","en-US":"Hiatus","es-ES":"Hiato"}'),
('publication_status', 'CANCELLED', '{"pt-BR":"Cancelado","en-US":"Cancelled","es-ES":"Cancelado"}'),
-- news_category
('news_category', 'PRINCIPAIS',    '{"pt-BR":"Principais","en-US":"Top News","es-ES":"Principales"}'),
('news_category', 'LANCAMENTOS',   '{"pt-BR":"Lançamentos","en-US":"Releases","es-ES":"Lanzamientos"}'),
('news_category', 'ADAPTACOES',    '{"pt-BR":"Adaptações","en-US":"Adaptations","es-ES":"Adaptaciones"}'),
('news_category', 'INDUSTRIA',     '{"pt-BR":"Indústria","en-US":"Industry","es-ES":"Industria"}'),
('news_category', 'ENTREVISTAS',   '{"pt-BR":"Entrevistas","en-US":"Interviews","es-ES":"Entrevistas"}'),
('news_category', 'EVENTOS',       '{"pt-BR":"Eventos","en-US":"Events","es-ES":"Eventos"}'),
('news_category', 'CURIOSIDADES',  '{"pt-BR":"Curiosidades","en-US":"Fun Facts","es-ES":"Curiosidades"}'),
('news_category', 'MERCADO',       '{"pt-BR":"Mercado","en-US":"Market","es-ES":"Mercado"}'),
('news_category', 'INTERNACIONAL', '{"pt-BR":"Internacional","en-US":"International","es-ES":"Internacional"}'),
-- event_type
('event_type', 'CONVENCAO',  '{"pt-BR":"Convenção","en-US":"Convention","es-ES":"Convención"}'),
('event_type', 'LANCAMENTO', '{"pt-BR":"Lançamento","en-US":"Launch","es-ES":"Lanzamiento"}'),
('event_type', 'LIVE',       '{"pt-BR":"Live","en-US":"Live","es-ES":"Live"}'),
('event_type', 'WORKSHOP',   '{"pt-BR":"Workshop","en-US":"Workshop","es-ES":"Taller"}'),
('event_type', 'MEETUP',     '{"pt-BR":"Meetup","en-US":"Meetup","es-ES":"Encuentro"}'),
-- event_status
('event_status', 'HAPPENING_NOW',      '{"pt-BR":"Acontecendo agora","en-US":"Happening Now","es-ES":"Ocurriendo ahora"}'),
('event_status', 'REGISTRATIONS_OPEN', '{"pt-BR":"Inscrições abertas","en-US":"Registrations Open","es-ES":"Inscripciones abiertas"}'),
('event_status', 'COMING_SOON',        '{"pt-BR":"Em breve","en-US":"Coming Soon","es-ES":"Próximamente"}'),
('event_status', 'ENDED',              '{"pt-BR":"Encerrado","en-US":"Ended","es-ES":"Finalizado"}'),
-- event_timeline
('event_timeline', 'UPCOMING', '{"pt-BR":"Próximos","en-US":"Upcoming","es-ES":"Próximos"}'),
('event_timeline', 'ONGOING',  '{"pt-BR":"Em andamento","en-US":"Ongoing","es-ES":"En curso"}'),
('event_timeline', 'PAST',     '{"pt-BR":"Passados","en-US":"Past","es-ES":"Pasados"}'),
-- currency
('currency', 'BRL', '{"pt-BR":"Real brasileiro","en-US":"Brazilian Real","es-ES":"Real brasileño"}'),
('currency', 'USD', '{"pt-BR":"Dólar americano","en-US":"US Dollar","es-ES":"Dólar estadounidense"}'),
('currency', 'EUR', '{"pt-BR":"Euro","en-US":"Euro","es-ES":"Euro"}'),
('currency', 'JPY', '{"pt-BR":"Iene japonês","en-US":"Japanese Yen","es-ES":"Yen japonés"}');
