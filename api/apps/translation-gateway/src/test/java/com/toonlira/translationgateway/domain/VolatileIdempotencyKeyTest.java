package com.toonlira.translationgateway.domain;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class VolatileIdempotencyKeyTest {
    private static final Instant NOW = Instant.parse("2026-11-01T12:00:00Z");
    static UUID key(Instant created) { return new UUID((created.toEpochMilli() << 16) | 0x7001L, 0x8000000000000001L); }
    @Test void acceptsAnImmutableV7TimeAndExpiresInclusively() {
        var key = key(NOW);
        assertThat(VolatileIdempotencyKey.active(key, NOW)).isTrue();
        assertThat(VolatileIdempotencyKey.active(key, NOW.plusSeconds(604800).minusMillis(1))).isTrue();
        assertThat(VolatileIdempotencyKey.active(key, NOW.plusSeconds(604800))).isFalse();
    }
    @Test void rejectsUnknownVersionsVariantsAndUnboundedFutureTimes() {
        assertThat(VolatileIdempotencyKey.active(UUID.randomUUID(), NOW)).isFalse();
        assertThat(VolatileIdempotencyKey.active(new UUID(key(NOW).getMostSignificantBits(), 1), NOW)).isFalse();
        assertThat(VolatileIdempotencyKey.active(key(NOW.plusSeconds(301)), NOW)).isFalse();
        assertThat(VolatileIdempotencyKey.active(key(NOW.plusSeconds(300)), NOW)).isTrue();
    }
}
