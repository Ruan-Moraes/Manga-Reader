package com.mangareader.application.analytics.usecase;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.analytics.port.BehaviorEventRepositoryPort;
import com.mangareader.domain.analytics.entity.BehaviorEvent;
import com.mangareader.domain.analytics.entity.BehaviorEventType;
import com.mangareader.domain.analytics.entity.BehaviorPlatform;
import com.mangareader.shared.config.BehaviorAnalyticsProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IngestBehaviorEventsUseCase {
    private static final Duration MAX_FUTURE_SKEW = Duration.ofMinutes(5);

    private final CanCollectBehaviorAnalyticsUseCase canCollectBehaviorAnalytics;
    private final BehaviorEventRepositoryPort repository;
    private final BehaviorAnalyticsProperties properties;
    private final Clock clock = Clock.systemUTC();

    public record EventInput(String eventId, BehaviorEventType type, String sessionId, Instant occurredAt,
            BehaviorPlatform platform, String appVersion, String source, String titleId, String chapterNumber,
            Long dwellMillis, Integer progressPercent, String searchTerm, Long resultCount, String dedupeKey) {}

    public int execute(UUID userId, List<EventInput> inputs) {
        if (inputs.isEmpty() || inputs.size() > properties.maxBatchSize()) {
            throw new IllegalArgumentException(
                    "Behavior event batch must contain between 1 and " + properties.maxBatchSize() + " items");
        }

        if (!canCollectBehaviorAnalytics.execute(userId)) {
            return 0;
        }

        Instant receivedAt = clock.instant();
        List<BehaviorEvent> events = inputs.stream()
                .map(input -> validateAndMap(userId, input, receivedAt))
                .toList();
        repository.insertIgnoringDuplicates(events);
        return events.size();
    }

    private BehaviorEvent validateAndMap(UUID userId, EventInput input, Instant receivedAt) {
        UUID.fromString(input.eventId());
        UUID.fromString(input.sessionId());
        if (input.occurredAt() == null || input.occurredAt().isAfter(receivedAt.plus(MAX_FUTURE_SKEW))) {
            throw new IllegalArgumentException("Invalid behavior event timestamp");
        }
        if (input.progressPercent() != null && (input.progressPercent() < 0 || input.progressPercent() > 100)) {
            throw new IllegalArgumentException("Progress must be between 0 and 100");
        }
        if (input.dwellMillis() != null && input.dwellMillis() < 0) {
            throw new IllegalArgumentException("Dwell time must not be negative");
        }
        if (input.resultCount() != null && input.resultCount() < 0) {
            throw new IllegalArgumentException("Result count must not be negative");
        }
        String searchTerm = input.searchTerm() == null ? null : input.searchTerm().trim();
        if (searchTerm != null && searchTerm.length() > 200) {
            throw new IllegalArgumentException("Search term must not exceed 200 characters");
        }
        validatePayload(input, searchTerm);
        return new BehaviorEvent(input.eventId(), 1, input.type(), userId.toString(), input.sessionId(),
                input.occurredAt(), receivedAt, receivedAt.plus(Duration.ofDays(properties.retentionDays())), input.platform(),
                input.appVersion(), input.source(), input.titleId(), input.chapterNumber(), input.dwellMillis(),
                input.progressPercent(), searchTerm, input.resultCount(), input.dedupeKey());
    }

    private void validatePayload(EventInput input, String searchTerm) {
        if (input.type() == null || input.platform() == null) {
            throw new IllegalArgumentException("Behavior event type and platform are required");
        }
        switch (input.type()) {
            case TITLE_VIEW_QUALIFIED, TITLE_VIEW_BOUNCE -> require(input.titleId(), "titleId");
            case CHAPTER_COMPLETED, CHAPTER_SESSION_STARTED, CHAPTER_PROGRESS_CHECKPOINT,
                    CHAPTER_SESSION_COMPLETED, CHAPTER_SESSION_PARTIAL, CHAPTER_NEXT_OPENED,
                    CHAPTER_RETURNED, CHAPTER_REREAD -> {
                require(input.titleId(), "titleId");
                require(input.chapterNumber(), "chapterNumber");
            }
            case SEARCH_PERFORMED, SEARCH_NO_RESULTS -> require(searchTerm, "searchTerm");
            case SEARCH_RESULT_CLICKED -> {
                require(searchTerm, "searchTerm");
                require(input.titleId(), "titleId");
            }
            case STORE_OUTBOUND_CLICK -> require(input.titleId(), "titleId");
            default -> { }
        }
    }

    private void require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required for this behavior event");
        }
    }
}
