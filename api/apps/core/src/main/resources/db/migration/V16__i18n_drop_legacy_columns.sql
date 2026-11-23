ALTER TABLE tags DROP COLUMN label;

ALTER TABLE events
    DROP COLUMN title,
    DROP COLUMN subtitle,
    DROP COLUMN description;

ALTER TABLE groups
    DROP COLUMN name,
    DROP COLUMN description;

ALTER TABLE stores
    DROP COLUMN name,
    DROP COLUMN description;

ALTER TABLE subscription_plans
    DROP COLUMN description,
    DROP COLUMN features;
