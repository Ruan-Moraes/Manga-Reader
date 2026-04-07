CREATE TABLE forum_topics (
    id                  UUID            NOT NULL PRIMARY KEY,
    author_id           UUID            NOT NULL,
    title               VARCHAR(300)    NOT NULL,
    content             TEXT            NOT NULL,
    category            VARCHAR(30)     NOT NULL,
    tags                JSONB,
    view_count          INTEGER         DEFAULT 0,
    reply_count         INTEGER         DEFAULT 0,
    like_count          INTEGER         DEFAULT 0,
    is_pinned           BOOLEAN         DEFAULT FALSE,
    is_locked           BOOLEAN         DEFAULT FALSE,
    is_solved           BOOLEAN         DEFAULT FALSE,
    created_at          TIMESTAMP       NOT NULL,
    last_activity_at    TIMESTAMP,

    CONSTRAINT fk_forum_topics_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE TABLE forum_replies (
    id              UUID        NOT NULL PRIMARY KEY,
    topic_id        UUID        NOT NULL,
    author_id       UUID        NOT NULL,
    content         TEXT        NOT NULL,
    likes           INTEGER     DEFAULT 0,
    is_edited       BOOLEAN     DEFAULT FALSE,
    is_best_answer  BOOLEAN     DEFAULT FALSE,
    created_at      TIMESTAMP   NOT NULL,

    CONSTRAINT fk_forum_replies_topic  FOREIGN KEY (topic_id)  REFERENCES forum_topics (id),
    CONSTRAINT fk_forum_replies_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE INDEX idx_forum_topics_author  ON forum_topics (author_id);
CREATE INDEX idx_forum_replies_topic  ON forum_replies (topic_id);
CREATE INDEX idx_forum_replies_author ON forum_replies (author_id);
