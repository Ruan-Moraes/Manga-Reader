package com.mangareader.domain.news.valueobject;

public enum NewsStatus {
    DRAFT,
    SCHEDULED,
    PUBLISHED,
    UNPUBLISHED;

    public static NewsStatus fromValue(String value) {
        if (value == null || value.isBlank()) return null;
        return valueOf(value.trim().toUpperCase());
    }
}
