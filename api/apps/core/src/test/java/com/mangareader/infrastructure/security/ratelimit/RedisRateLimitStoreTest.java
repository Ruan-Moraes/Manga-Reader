package com.mangareader.infrastructure.security.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

class RedisRateLimitStoreTest {
    @Test
    void boundsNovelIdentitiesInFallbackBySharingAnOverflowBucket() {
        StringRedisTemplate unavailableRedis = mock(StringRedisTemplate.class, invocation -> {
            throw new RedisConnectionFailureException("down");
        });
        var store = new RedisRateLimitStore(unavailableRedis, new SimpleMeterRegistry(), 1);

        assertThat(store.consume("first|general", 1, Duration.ofMinutes(1)).allowed()).isTrue();
        assertThat(store.consume("second|general", 1, Duration.ofMinutes(1)).allowed()).isTrue();
        assertThat(store.consume("third|general", 1, Duration.ofMinutes(1)).allowed()).isFalse();
    }
}
