package com.mangareader.infrastructure.security.ratelimit;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class RedisRateLimitStore implements RateLimitStore {
    private static final int DEFAULT_MAX_LOCAL_IDENTITIES = 10_000;
    private static final long FALLBACK_LOG_INTERVAL_NANOS = TimeUnit.MINUTES.toNanos(1);
    private static final DefaultRedisScript<List> SCRIPT = new DefaultRedisScript<>("""
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
            local ttl = redis.call('PTTL', KEYS[1])
            return {current, ttl}
            """, List.class);

    private final StringRedisTemplate redis;
    private final MeterRegistry metrics;
    private final int maxLocalIdentities;
    private final Map<String, LocalWindow> fallback = new ConcurrentHashMap<>();
    private final AtomicLong nextFallbackLogNanos = new AtomicLong();

    @Autowired
    public RedisRateLimitStore(StringRedisTemplate redis, MeterRegistry metrics) {
        this(redis, metrics, DEFAULT_MAX_LOCAL_IDENTITIES);
    }

    RedisRateLimitStore(StringRedisTemplate redis, MeterRegistry metrics, int maxLocalIdentities) {
        if (maxLocalIdentities < 1) throw new IllegalArgumentException("maxLocalIdentities must be positive");
        this.redis = redis;
        this.metrics = metrics;
        this.maxLocalIdentities = maxLocalIdentities;
    }

    @Override
    public Decision consume(String key, long capacity, Duration window) {
        String redisKey = "rate-limit:" + hash(key);
        try {
            List<?> result = redis.execute(SCRIPT, List.of(redisKey), String.valueOf(window.toMillis()));
            if (result == null || result.size() != 2) throw new IllegalStateException("Invalid Redis rate-limit response");
            long current = ((Number) result.get(0)).longValue();
            long ttlMillis = Math.max(0, ((Number) result.get(1)).longValue());
            return observe(decision(current, capacity, ttlMillis));
        } catch (RuntimeException ignored) {
            metrics.counter("mangahost.rate_limit.store", "result", "fallback").increment();
            warnFallback();
            return observe(consumeLocal(key, capacity, window));
        }
    }

    private Decision consumeLocal(String key, long capacity, Duration window) {
        long now = System.currentTimeMillis();
        String localKey = boundedLocalKey(key, now);
        LocalWindow current = fallback.compute(localKey, (ignored, existing) ->
                existing == null || existing.expiresAtMillis <= now
                        ? new LocalWindow(1, now + window.toMillis())
                        : new LocalWindow(existing.count + 1, existing.expiresAtMillis));
        return decision(current.count, capacity, current.expiresAtMillis - now);
    }

    private String boundedLocalKey(String requestedKey, long now) {
        if (fallback.containsKey(requestedKey) || fallback.size() < maxLocalIdentities) {
            return requestedKey;
        }
        fallback.entrySet().removeIf(entry -> entry.getValue().expiresAtMillis <= now);
        if (fallback.containsKey(requestedKey) || fallback.size() < maxLocalIdentities) {
            return requestedKey;
        }
        return requestedKey.endsWith("|auth") ? "__overflow__|auth" : "__overflow__|general";
    }

    private void warnFallback() {
        long now = System.nanoTime();
        long next = nextFallbackLogNanos.get();
        if (now >= next && nextFallbackLogNanos.compareAndSet(next, now + FALLBACK_LOG_INTERVAL_NANOS)) {
            log.warn("Redis rate-limit unavailable; using process-local fallback");
        }
    }

    private static Decision decision(long current, long capacity, long ttlMillis) {
        return new Decision(current <= capacity, Math.max(0, capacity - current), Math.max(1, (ttlMillis + 999) / 1000));
    }

    private Decision observe(Decision decision) {
        metrics.counter("mangahost.rate_limit.requests", "result",
                decision.allowed() ? "allowed" : "blocked").increment();
        return decision;
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private record LocalWindow(long count, long expiresAtMillis) {}
}
