package com.mangareader.domain.analytics.entity;

import java.time.Instant;

public record BehaviorEvent(
        String eventId,
        int schemaVersion,
        BehaviorEventType type,
        String userId,
        String sessionId,
        Instant occurredAt,
        Instant receivedAt,
        Instant expiresAt,
        BehaviorPlatform platform,
        String appVersion,
        String source,
        String titleId,
        String chapterNumber,
        Long dwellMillis,
        Integer progressPercent,
        String searchTerm,
        Long resultCount,
        String dedupeKey) {
}
