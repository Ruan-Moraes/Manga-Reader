CREATE INDEX idx_gift_codes_recipient ON gift_codes (recipient_email);

CREATE INDEX idx_subscriptions_end_date ON subscriptions (end_date)
    WHERE status = 'ACTIVE';
