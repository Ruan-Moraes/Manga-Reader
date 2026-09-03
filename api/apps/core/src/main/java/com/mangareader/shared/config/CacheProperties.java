package com.mangareader.shared.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties("app.cache")
public record CacheProperties(
        @NotNull Duration defaultTtl,
        @NotNull Duration titleTtl,
        @NotNull Duration tagTtl,
        @NotNull Duration ratingAverageTtl,
        @NotNull Duration publicStatsTtl,
        @NotNull Duration subscriptionPlansTtl) {}
