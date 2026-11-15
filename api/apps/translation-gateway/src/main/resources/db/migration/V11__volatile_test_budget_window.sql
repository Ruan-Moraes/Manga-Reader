-- Operational aggregate only: one irreversible reservation per accepted test attempt.
-- Individual receipts expire independently; no image, text or installation identity is retained here.
CREATE TABLE volatile_test_budget_window (
    window_key varchar(64) PRIMARY KEY CHECK (window_key = 'private-test'),
    attempts_reserved bigint NOT NULL CHECK (attempts_reserved >= 0)
);
