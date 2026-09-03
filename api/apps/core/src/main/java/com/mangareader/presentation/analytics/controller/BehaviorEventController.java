package com.mangareader.presentation.analytics.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.analytics.usecase.ClearBehaviorHistoryUseCase;
import com.mangareader.application.analytics.usecase.CanCollectBehaviorAnalyticsUseCase;
import com.mangareader.application.analytics.usecase.IngestBehaviorEventsUseCase;
import com.mangareader.application.analytics.usecase.IngestBehaviorEventsUseCase.EventInput;
import com.mangareader.domain.analytics.entity.BehaviorEventType;
import com.mangareader.domain.analytics.entity.BehaviorPlatform;
import com.mangareader.presentation.analytics.dto.BehaviorEventBatchRequest;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.config.BehaviorAnalyticsProperties;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BehaviorEventController {
    private final IngestBehaviorEventsUseCase ingestUseCase;
    private final ClearBehaviorHistoryUseCase clearUseCase;
    private final CanCollectBehaviorAnalyticsUseCase canCollectBehaviorAnalytics;
    private final BehaviorAnalyticsProperties properties;

    public record TrackingConfig(boolean enabled, int titleViewSeconds, int bounceMinSeconds,
            int chapterStartSeconds, int chapterCompletionPercent, int maxBatchSize) {}
    public record BatchResponse(List<String> acceptedEventIds) {}

    @GetMapping("/behavior-events/config")
    public ResponseEntity<ApiResponse<TrackingConfig>> config(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(new TrackingConfig(canCollectBehaviorAnalytics.execute(userId),
                properties.titleViewSeconds(), properties.bounceMinSeconds(),
                properties.chapterStartSeconds(), properties.chapterCompletionPercent(), properties.maxBatchSize())));
    }

    @PostMapping("/behavior-events/batch")
    public ResponseEntity<ApiResponse<BatchResponse>> ingest(@Valid @RequestBody BehaviorEventBatchRequest request,
            Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        List<EventInput> inputs = request.events().stream().map(this::toInput).toList();
        ingestUseCase.execute(userId, inputs);
        List<String> acceptedIds = request.events().stream()
                .map(BehaviorEventBatchRequest.EventRequest::eventId).toList();
        return ResponseEntity.accepted().body(ApiResponse.success(new BatchResponse(acceptedIds)));
    }

    @DeleteMapping("/users/me/behavior-history")
    public ResponseEntity<Void> clear(Authentication authentication) {
        clearUseCase.execute(authentication.getPrincipal().toString());
        return ResponseEntity.noContent().build();
    }

    private EventInput toInput(BehaviorEventBatchRequest.EventRequest event) {
        BehaviorEventType type = BehaviorEventType.valueOf(event.type());
        BehaviorPlatform platform = BehaviorPlatform.valueOf(event.platform());
        if (!type.acceptsClientSubmission() || platform != BehaviorPlatform.WEB) {
            throw new IllegalArgumentException("Unsupported client behavior event");
        }
        return new EventInput(event.eventId(), type, event.sessionId(),
                event.occurredAt(), platform, event.appVersion(), event.source(),
                event.titleId(), event.chapterNumber(), event.dwellMillis(), event.progressPercent(),
                event.searchTerm(), event.resultCount(), event.dedupeKey());
    }
}
