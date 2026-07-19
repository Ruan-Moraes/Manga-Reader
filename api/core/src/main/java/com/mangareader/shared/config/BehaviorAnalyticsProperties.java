package com.mangareader.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

@Validated
@ConfigurationProperties("app.behavior-analytics")
public record BehaviorAnalyticsProperties(
        @Positive long retentionDays,
        @Positive int titleViewSeconds,
        @Min(0) int bounceMinSeconds,
        @Positive int chapterStartSeconds,
        @Min(1) @Max(100) int chapterCompletionPercent,
        @Min(1) @Max(1000) int maxBatchSize) {}
