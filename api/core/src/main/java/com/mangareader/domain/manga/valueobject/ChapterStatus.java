package com.mangareader.domain.manga.valueobject;

public enum ChapterStatus {
    DRAFT, PROCESSING, SCHEDULED, PUBLISHED, HIDDEN, UNAVAILABLE, ARCHIVED;

    public boolean canTransitionTo(ChapterStatus next) {
        return switch (this) {
            case DRAFT -> next == PROCESSING || next == SCHEDULED || next == PUBLISHED || next == ARCHIVED;
            case PROCESSING -> next == DRAFT || next == PUBLISHED;
            case SCHEDULED -> next == DRAFT || next == PUBLISHED || next == ARCHIVED;
            case PUBLISHED -> next == HIDDEN || next == UNAVAILABLE || next == ARCHIVED;
            case HIDDEN, UNAVAILABLE -> next == PUBLISHED || next == ARCHIVED;
            case ARCHIVED -> next == DRAFT;
        };
    }
}
