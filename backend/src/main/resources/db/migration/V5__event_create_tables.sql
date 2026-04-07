CREATE TABLE events (
    id                      UUID            NOT NULL PRIMARY KEY,
    title                   VARCHAR(200)    NOT NULL,
    subtitle                VARCHAR(500),
    description             VARCHAR(5000),
    image                   VARCHAR(255),
    gallery                 JSONB,
    start_date              TIMESTAMP       NOT NULL,
    end_date                TIMESTAMP       NOT NULL,
    timezone                VARCHAR(50),
    timeline                VARCHAR(20)     NOT NULL,
    status                  VARCHAR(30)     NOT NULL,
    type                    VARCHAR(20)     NOT NULL,

    -- @Embedded EventLocation
    label                   VARCHAR(255),
    address                 VARCHAR(255),
    city                    VARCHAR(255),
    is_online               BOOLEAN         DEFAULT FALSE,
    map_link                VARCHAR(255),
    directions              VARCHAR(255),

    -- @Embedded EventOrganizer
    organizer_id            VARCHAR(255),
    organizer_name          VARCHAR(255),
    organizer_avatar        VARCHAR(255),
    organizer_profile_link  VARCHAR(255),
    organizer_contact       VARCHAR(255),

    price_label             VARCHAR(100),
    participants            INTEGER         DEFAULT 0,
    interested              INTEGER         DEFAULT 0,
    is_featured             BOOLEAN         DEFAULT FALSE,
    schedule                JSONB,
    special_guests          JSONB,
    social_links            JSONB,
    related_event_ids       JSONB,
    created_at              TIMESTAMP       NOT NULL,
    updated_at              TIMESTAMP
);

CREATE TABLE event_tickets (
    id          UUID            NOT NULL PRIMARY KEY,
    event_id    UUID            NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    price       VARCHAR(50)     NOT NULL,
    available   INTEGER         DEFAULT 0,

    CONSTRAINT fk_event_tickets_event FOREIGN KEY (event_id) REFERENCES events (id)
);

CREATE TABLE event_participants (
    id          UUID        NOT NULL PRIMARY KEY,
    event_id    UUID        NOT NULL,
    user_id     UUID        NOT NULL,
    joined_at   TIMESTAMP,

    CONSTRAINT fk_event_participants_event FOREIGN KEY (event_id) REFERENCES events (id),
    CONSTRAINT fk_event_participants_user  FOREIGN KEY (user_id)  REFERENCES users (id),
    CONSTRAINT uk_event_participants_event_user UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_tickets_event      ON event_tickets (event_id);
CREATE INDEX idx_event_participants_event ON event_participants (event_id);
CREATE INDEX idx_event_participants_user  ON event_participants (user_id);
