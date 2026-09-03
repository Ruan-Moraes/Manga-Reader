package com.mangareader.infrastructure.security.ratelimit;

import java.time.Duration;

public interface RateLimitStore {
    record Decision(boolean allowed, long remaining, long retryAfterSeconds) {}

    Decision consume(String key, long capacity, Duration window);
}
