ALTER TABLE subscriptions
    ADD CONSTRAINT fk_subscriptions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT;

ALTER TABLE gift_codes
    ADD CONSTRAINT fk_gift_codes_sender
        FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_gift_codes_redeemer
        FOREIGN KEY (redeemed_by_user_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE subscription_audit_logs
    ADD CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_audit_performed_by
        FOREIGN KEY (performed_by) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_gift_codes_redeemer ON gift_codes (redeemed_by_user_id);
CREATE INDEX idx_gift_codes_plan ON gift_codes (plan_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions (plan_id);
CREATE INDEX idx_audit_performed_by ON subscription_audit_logs (performed_by);
