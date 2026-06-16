ALTER TABLE forum_replies RENAME COLUMN is_edited TO edited;
ALTER TABLE forum_replies ALTER COLUMN edited SET DEFAULT FALSE;
ALTER TABLE forum_replies ADD COLUMN updated_at TIMESTAMP;
UPDATE forum_replies SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE forum_topics ADD COLUMN edited BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE forum_topics ADD COLUMN updated_at TIMESTAMP;
UPDATE forum_topics SET updated_at = created_at WHERE updated_at IS NULL;
