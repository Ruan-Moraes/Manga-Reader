package com.mangareader.domain.manga.valueobject;

public enum ReleasePeriod {
    DAY(1),
    WEEK(7),
    MONTH(30);

    private final int calendarDays;

    ReleasePeriod(int calendarDays) {
        this.calendarDays = calendarDays;
    }

    public int calendarDays() {
        return calendarDays;
    }
}
