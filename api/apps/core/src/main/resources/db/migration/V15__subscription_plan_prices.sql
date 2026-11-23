ALTER TABLE subscription_plans
    ADD COLUMN prices JSONB NOT NULL DEFAULT '{}';

UPDATE subscription_plans
SET prices = jsonb_build_object('BRL', price_in_cents);
