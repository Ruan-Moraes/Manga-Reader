CREATE TABLE subscription_audit_logs (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    subscription_id UUID            NOT NULL,
    user_id         UUID            NOT NULL,
    action          VARCHAR(30)     NOT NULL,
    performed_by    UUID,
    details         VARCHAR(500),
    created_at      TIMESTAMP       NOT NULL DEFAULT now(),

    CONSTRAINT pk_subscription_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_subscription_audit_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
);

CREATE INDEX idx_audit_subscription ON subscription_audit_logs (subscription_id);
CREATE INDEX idx_audit_user ON subscription_audit_logs (user_id);
CREATE INDEX idx_audit_created_at ON subscription_audit_logs (created_at DESC);
