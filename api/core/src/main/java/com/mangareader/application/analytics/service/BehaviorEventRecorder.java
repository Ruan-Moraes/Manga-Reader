package com.mangareader.application.analytics.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.mangareader.domain.analytics.entity.BehaviorEventType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BehaviorEventRecorder {
    private final ApplicationEventPublisher eventPublisher;

    public record ServerBehaviorEvent(String eventId, UUID userId, BehaviorEventType type, String titleId,
            String chapterNumber, String source, Instant occurredAt) {}

    public void record(UUID userId, BehaviorEventType type, String titleId, String chapterNumber,
            String source) {
        eventPublisher.publishEvent(new ServerBehaviorEvent(UUID.randomUUID().toString(), userId, type,
                titleId, chapterNumber, source, Instant.now()));
    }
}
