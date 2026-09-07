package com.toonlira.trending.domain;

public record TrendScore(double value, double growthPercent, TrendMetrics metrics, TrendGrowth growth) {}
