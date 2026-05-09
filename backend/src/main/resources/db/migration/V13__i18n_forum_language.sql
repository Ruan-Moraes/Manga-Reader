ALTER TABLE forum_topics
    ADD COLUMN language VARCHAR(10) NOT NULL DEFAULT 'pt-BR';

ALTER TABLE forum_replies
    ADD COLUMN language VARCHAR(10) NOT NULL DEFAULT 'pt-BR';

CREATE INDEX idx_forum_topics_language_created  ON forum_topics  (language, created_at DESC);
CREATE INDEX idx_forum_replies_language_created ON forum_replies (language, created_at DESC);
