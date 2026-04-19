CREATE TABLE subscription_plans (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    period        VARCHAR(20)  NOT NULL,
    price_in_cents BIGINT      NOT NULL,
    description   VARCHAR(300) NOT NULL,
    features      JSONB        NOT NULL DEFAULT '[]',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_subscription_plans PRIMARY KEY (id),
    CONSTRAINT uq_subscription_plans_period UNIQUE (period),
    CONSTRAINT chk_subscription_plans_period CHECK (period IN ('DAILY', 'MONTHLY', 'ANNUAL')),
    CONSTRAINT chk_subscription_plans_price CHECK (price_in_cents > 0)
);

CREATE TABLE subscriptions (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL,
    plan_id             UUID        NOT NULL,
    start_date          TIMESTAMP   NOT NULL,
    end_date            TIMESTAMP   NOT NULL,
    status              VARCHAR(20) NOT NULL,
    external_payment_id VARCHAR(255),
    created_at          TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP,

    CONSTRAINT pk_subscriptions PRIMARY KEY (id),
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans (id),
    CONSTRAINT chk_subscriptions_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED'))
);

CREATE TABLE gift_codes (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    code                VARCHAR(36) NOT NULL,
    plan_id             UUID        NOT NULL,
    sender_user_id      UUID        NOT NULL,
    recipient_email     VARCHAR(255) NOT NULL,
    redeemed_by_user_id UUID,
    redeemed_at         TIMESTAMP,
    expires_at          TIMESTAMP   NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMP   NOT NULL DEFAULT now(),

    CONSTRAINT pk_gift_codes PRIMARY KEY (id),
    CONSTRAINT uq_gift_codes_code UNIQUE (code),
    CONSTRAINT fk_gift_codes_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans (id),
    CONSTRAINT chk_gift_codes_status CHECK (status IN ('PENDING', 'REDEEMED', 'EXPIRED'))
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_gift_codes_code ON gift_codes (code);
CREATE INDEX idx_gift_codes_sender ON gift_codes (sender_user_id);