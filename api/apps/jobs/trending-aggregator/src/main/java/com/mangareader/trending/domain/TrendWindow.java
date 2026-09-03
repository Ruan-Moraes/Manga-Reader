package com.mangareader.trending.domain;

public enum TrendWindow { DAY(1), WEEK(7), MONTH(30); private final int days; TrendWindow(int days) { this.days = days; } public int days() { return days; } }
