package com.mangareader.trending.domain;

import java.time.LocalDate;
import java.time.Instant;
import java.util.Map;

public record TrendSnapshot(String id, String titleId, LocalDate snapshotDate,
        Instant calculatedAt, Map<TrendWindow, TrendScore> scores) {
    public TrendSnapshot {
        if (titleId == null || titleId.isBlank()) {
            throw new IllegalArgumentException("titleId must not be blank");
        }
        if (snapshotDate == null || calculatedAt == null) {
            throw new IllegalArgumentException("snapshotDate and calculatedAt are required");
        }
        scores = Map.copyOf(scores);
        if (!scores.keySet().containsAll(java.util.EnumSet.allOf(TrendWindow.class))) {
            throw new IllegalArgumentException("scores must contain every trend window");
        }
    }

    public static TrendSnapshot of(String titleId, LocalDate date, Instant calculatedAt,
            Map<TrendWindow, TrendScore> scores) {
        return new TrendSnapshot(titleId + ":" + date, titleId, date, calculatedAt, scores);
    }
}
