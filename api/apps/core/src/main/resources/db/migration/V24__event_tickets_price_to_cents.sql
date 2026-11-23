ALTER TABLE event_tickets
    ADD COLUMN price_in_cents bigint,
    ADD COLUMN currency       varchar(3) NOT NULL DEFAULT 'BRL';

UPDATE event_tickets
SET price_in_cents = COALESCE(
        ROUND(
            NULLIF(
                regexp_replace(replace(price, ',', '.'), '[^0-9.]', '', 'g'),
                ''
            )::numeric * 100
        ),
        0
    );

ALTER TABLE event_tickets
    ALTER COLUMN price_in_cents SET DEFAULT 0,
    ALTER COLUMN price_in_cents SET NOT NULL;

ALTER TABLE event_tickets
    ADD CONSTRAINT chk_event_tickets_price CHECK (price_in_cents >= 0);

ALTER TABLE event_tickets
    DROP COLUMN price;
