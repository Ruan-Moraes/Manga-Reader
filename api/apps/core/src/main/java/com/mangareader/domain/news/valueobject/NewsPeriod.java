package com.mangareader.domain.news.valueobject;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public enum NewsPeriod {
    ALL(null), TODAY(1L), WEEK(7L), MONTH(30L);

    private final Long days;
    NewsPeriod(Long days) { this.days = days; }

    public Instant lowerBound(Instant now) {
        return days == null ? null : now.minus(days, ChronoUnit.DAYS);
    }

    public static NewsPeriod fromValue(String value) {
        return value == null || value.isBlank() ? ALL : valueOf(value.trim().toUpperCase());
    }
}
