package com.toonlira.translationgateway.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/** UUIDv7 time is immutable: old keys cannot become executable again after receipt cleanup. */
public final class VolatileIdempotencyKey {
    public static final Duration VALIDITY = Duration.ofDays(7);
    private static final Duration MAX_FUTURE_SKEW = Duration.ofMinutes(5);
    private VolatileIdempotencyKey() { }
    public static boolean active(UUID key, Instant now) {
        if (key == null || now == null || key.version() != 7 || key.variant() != 2) return false;
        var created = Instant.ofEpochMilli(key.getMostSignificantBits() >>> 16);
        return !created.isAfter(now.plus(MAX_FUTURE_SKEW)) && now.isBefore(created.plus(VALIDITY));
    }
}
