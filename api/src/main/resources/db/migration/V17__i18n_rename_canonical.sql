ALTER TABLE tags                RENAME COLUMN label_i18n       TO label;

ALTER TABLE events              RENAME COLUMN title_i18n       TO title;
ALTER TABLE events              RENAME COLUMN subtitle_i18n    TO subtitle;
ALTER TABLE events              RENAME COLUMN description_i18n TO description;

ALTER TABLE groups              RENAME COLUMN name_i18n        TO name;
ALTER TABLE groups              RENAME COLUMN description_i18n TO description;

ALTER TABLE stores              RENAME COLUMN name_i18n        TO name;
ALTER TABLE stores              RENAME COLUMN description_i18n TO description;

ALTER TABLE subscription_plans  RENAME COLUMN description_i18n TO description;
ALTER TABLE subscription_plans  RENAME COLUMN features_i18n    TO features;
