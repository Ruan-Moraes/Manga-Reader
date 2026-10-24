CREATE TABLE event_organizers (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id  varchar(255) UNIQUE,
    name         varchar(255),
    avatar       varchar(255),
    profile_link varchar(255),
    contact      varchar(255)
);

ALTER TABLE events ADD COLUMN organizer_ref uuid;

INSERT INTO event_organizers (external_id, name, avatar, profile_link, contact)
SELECT DISTINCT ON (organizer_id)
       organizer_id, organizer_name, organizer_avatar, organizer_profile_link, organizer_contact
FROM events
WHERE organizer_id IS NOT NULL
ORDER BY organizer_id;

UPDATE events e
SET organizer_ref = o.id
FROM event_organizers o
WHERE o.external_id = e.organizer_id;

DO $$
DECLARE
    r       RECORD;
    new_id  uuid;
BEGIN
    FOR r IN
        SELECT id, organizer_name, organizer_avatar, organizer_profile_link, organizer_contact
        FROM events
        WHERE organizer_ref IS NULL AND organizer_name IS NOT NULL
    LOOP
        INSERT INTO event_organizers (external_id, name, avatar, profile_link, contact)
        VALUES (NULL, r.organizer_name, r.organizer_avatar, r.organizer_profile_link, r.organizer_contact)
        RETURNING id INTO new_id;

        UPDATE events SET organizer_ref = new_id WHERE id = r.id;
    END LOOP;
END $$;

ALTER TABLE events
    ADD CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_ref) REFERENCES event_organizers (id) ON DELETE SET NULL;

CREATE INDEX idx_events_organizer_ref ON events (organizer_ref);

ALTER TABLE events
    DROP COLUMN organizer_id,
    DROP COLUMN organizer_name,
    DROP COLUMN organizer_avatar,
    DROP COLUMN organizer_profile_link,
    DROP COLUMN organizer_contact;
