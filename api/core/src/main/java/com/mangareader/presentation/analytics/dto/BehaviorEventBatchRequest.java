package com.mangareader.presentation.analytics.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BehaviorEventBatchRequest(
        @NotEmpty @Size(max = 100) List<@Valid EventRequest> events) {

    public record EventRequest(
            @NotBlank String eventId,
            @NotBlank String type,
            @NotBlank String sessionId,
            @NotNull Instant occurredAt,
            @NotBlank String platform,
            @Size(max = 50) String appVersion,
            @Size(max = 50) String source,
            @Size(max = 100) String titleId,
            @Size(max = 30) String chapterNumber,
            Long dwellMillis,
            Integer progressPercent,
            @Size(max = 200) String searchTerm,
            Long resultCount,
            @Size(max = 200) String dedupeKey) {
    }
}
