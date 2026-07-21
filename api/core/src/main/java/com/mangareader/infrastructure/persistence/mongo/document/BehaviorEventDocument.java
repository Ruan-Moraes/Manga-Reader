package com.mangareader.infrastructure.persistence.mongo.document;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.domain.analytics.entity.BehaviorEventType;
import com.mangareader.domain.analytics.entity.BehaviorPlatform;

import lombok.Builder;

@Document("behavior_events")
@Builder
public record BehaviorEventDocument(
        @Id String id,
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
