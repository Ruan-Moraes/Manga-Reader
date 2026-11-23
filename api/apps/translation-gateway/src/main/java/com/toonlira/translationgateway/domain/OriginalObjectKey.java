package com.toonlira.translationgateway.domain;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Private immutable deadline locator. Never expose it in tasks, APIs or logs. */
public final class OriginalObjectKey {
    public static final int MAX_RETENTION_SECONDS = 3600;
    public static final String PREFIX = "private/originals/";
    private static final String VERSIONED_PREFIX = PREFIX + "v1/";
    private OriginalObjectKey() { }

    public static String create(Instant createdAt, int retentionSeconds) {
        requireSeconds(retentionSeconds);
        if (createdAt == null) throw invalid();
        var expiry = createdAt.plusSeconds(retentionSeconds);
        return VERSIONED_PREFIX + expiry.getEpochSecond() + "-" + expiry.getNano() + "/" + UUID.randomUUID();
    }

    public static int requireSeconds(int seconds) {
        if (seconds < 1 || seconds > MAX_RETENTION_SECONDS) throw invalid();
        return seconds;
    }

    public static Optional<Instant> expiry(String key) {
        if (key == null || !key.startsWith(VERSIONED_PREFIX)) return Optional.empty();
        try {
            var parts = key.substring(VERSIONED_PREFIX.length()).split("/", -1);
            if (parts.length != 2 || !UUID.fromString(parts[1]).toString().equals(parts[1])) throw invalid();
            int separator = parts[0].lastIndexOf('-');
            if (separator <= 0) throw invalid();
            long seconds = Long.parseLong(parts[0].substring(0, separator));
            int nanos = Integer.parseInt(parts[0].substring(separator + 1));
            if (nanos < 0 || nanos > 999_999_999 || !parts[0].equals(seconds + "-" + nanos)) throw invalid();
            return Optional.of(Instant.ofEpochSecond(seconds, nanos));
        } catch (RuntimeException malformed) { throw invalid(); }
    }

    public static void validateForStore(String key, Instant createdAt) {
        var expiry = expiry(key);
        if (expiry.isPresent() && (createdAt == null || !expiry.get().isAfter(createdAt)
            || expiry.get().isAfter(createdAt.plusSeconds(MAX_RETENTION_SECONDS)))) throw invalid();
    }

    private static IllegalArgumentException invalid() { return new IllegalArgumentException("Invalid original retention locator"); }
}
