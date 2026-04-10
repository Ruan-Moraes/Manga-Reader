CREATE TABLE payments (
    id              UUID            NOT NULL PRIMARY KEY,
    user_id         UUID            NOT NULL REFERENCES users(id),
    amount          DECIMAL(10, 2)  NOT NULL,
    currency        VARCHAR(3)      NOT NULL DEFAULT 'BRL',
    status          VARCHAR(20)     NOT NULL,
    payment_method  VARCHAR(30),
    description     VARCHAR(500),
    reference_type  VARCHAR(30),
    reference_id    VARCHAR(255),
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL,
    updated_at      TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_created_at ON payments (created_at DESC);
