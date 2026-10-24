package com.toonlira.translationgateway.domain.rendering;

import java.time.Instant;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/** Private immutable locator for final artifacts; never expose in API/task/logs. */
public final class ResultObjectKey {
    public static final String PREFIX = "private/rendering/";
    private static final String VERSIONED_PREFIX = PREFIX + "v1/";
    private ResultObjectKey() { }

    public static String create(Instant expiry, String extension) {
        if (expiry == null || !("webp".equals(extension) || "json".equals(extension))) throw invalid();
        return VERSIONED_PREFIX + expiry.getEpochSecond() + "-" + expiry.getNano() + "/" + UUID.randomUUID() + "." + extension;
    }

    public static Optional<Instant> expiry(String key) {
        if (key == null) throw invalid();
        if (!key.startsWith(VERSIONED_PREFIX)) {
            if (key.matches("private/rendering/v[0-9]+/.*")) throw invalid();
            return Optional.empty();
        }
        try {
            var parts = key.substring(VERSIONED_PREFIX.length()).split("/", -1);
            if (parts.length != 2) throw invalid();
            int dot = parts[1].lastIndexOf('.');
            if (dot <= 0 || !(parts[1].substring(dot).equals(".webp") || parts[1].substring(dot).equals(".json"))) throw invalid();
            var token = parts[1].substring(0, dot);
            if (!UUID.fromString(token).toString().equals(token)) throw invalid();
            int dash = parts[0].lastIndexOf('-');
            if (dash <= 0) throw invalid();
            long seconds = Long.parseLong(parts[0].substring(0, dash));
            int nanos = Integer.parseInt(parts[0].substring(dash + 1));
            if (nanos < 0 || nanos > 999_999_999 || !parts[0].equals(seconds + "-" + nanos)) throw invalid();
            return Optional.of(Instant.ofEpochSecond(seconds, nanos));
        } catch (RuntimeException malformed) { throw invalid(); }
    }

    public static void validateForStore(String key, Instant createdAt) {
        var expiry = expiry(key);
        if (expiry.isPresent() && (createdAt == null || !expiry.get().isAfter(createdAt)
            || Duration.between(createdAt, expiry.get()).compareTo(Duration.ofSeconds(3600)) > 0)) throw invalid();
    }

    private static IllegalArgumentException invalid() { return new IllegalArgumentException("Invalid result retention locator"); }
}
